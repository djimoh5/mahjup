import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import { keyframes } from '@emotion/react';
import { gameService } from '../services/game.service';
import {
  type GameAnalysis,
  type GameAnalysisTimeRange,
  normalizeGameAnalysisFilters,
  gameAnalysisFiltersKey,
} from '../../model/game-analysis.model';
import type { GameRecord } from '../../model/game.model';
import type { UserSummary } from '../../model/user.model';
import { TrashIcon } from './icons/Icons';
import { useIsMobile } from '../hooks/useIsMobile';

const wave = keyframes`
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
`;

const cardSx = {
  mb: 3,
  p: '1.25rem 1.5rem',
  background: 'rgba(255,255,255,0.88)',
  borderRadius: '1rem',
  border: '1px solid rgba(242,171,164,0.35)',
  backdropFilter: 'blur(8px)',
};

const TIME_LABELS: Record<GameAnalysisTimeRange, string> = {
  all: 'All Time',
  week: 'Past Week',
  weeks2: 'Past 2 Weeks',
  month: 'Past Month',
  months2: 'Past 2 Months',
  months3: 'Past 3 Months',
  months6: 'Past 6 Months',
  year: 'Past Year',
};

interface AiSummaryTabProps {
  analyses: GameAnalysis[];
  records: GameRecord[];
  users: UserSummary[];
  usersMap: Record<string, UserSummary>;
  currentUserOid: string;
  lastModifiedAt: number;
  onAnalysisUpdated: (analysis: GameAnalysis) => void;
  onAnalysisDeleted: (oid: string) => Promise<{ error?: string }>;
}

function displayName(userId: string, usersMap: Record<string, UserSummary>): string {
  const u = usersMap[userId];
  if (!u) return 'Unknown';
  return u.firstName ? `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}` : u.username;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function AiSummaryTab({
  analyses, records, usersMap, currentUserOid, onAnalysisUpdated, onAnalysisDeleted,
}: AiSummaryTabProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState<GameAnalysisTimeRange>('all');
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emptyResultContent, setEmptyResultContent] = useState<string | null>(null);
  const [pendingDeleteOid, setPendingDeleteOid] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selectablePlayers = useMemo(() => {
    const ids = new Set<string>();
    for (const r of records) {
      for (const p of r.players ?? []) {
        if (p.userId && p.userId !== currentUserOid) ids.add(p.userId);
      }
    }
    return [...ids]
      .map(oid => ({ oid, name: displayName(oid, usersMap) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [records, usersMap, currentUserOid]);

  const filters = useMemo(() => normalizeGameAnalysisFilters({ timeRange, playerIds }), [timeRange, playerIds]);
  const filtersKey = useMemo(() => gameAnalysisFiltersKey(filters), [filters]);

  // Only an exact filters match should surface an existing summary — two different
  // filter combos that happen to select the same underlying games are still treated
  // as distinct summaries.
  const currentAnalysis = useMemo(() => {
    return analyses.find(a => a.filtersKey === filtersKey) ?? null;
  }, [analyses, filtersKey]);

  // An empty-result message belongs to whichever filter combo produced it; switching
  // filters should clear it rather than showing a stale message for the new selection.
  useEffect(() => {
    setEmptyResultContent(null);
  }, [filtersKey]);

  async function handleGenerate() {
    setIsLoading(true);
    setEmptyResultContent(null);
    const { analysis } = await gameService.getSummary(filters);
    if (analysis) {
      // Empty-result messages aren't persisted server-side (no oid) — show them
      // transiently instead of adding them to history.
      if (analysis.oid) onAnalysisUpdated(analysis);
      else setEmptyResultContent(analysis.content);
    }
    setIsLoading(false);
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteOid) return;
    const { error } = await onAnalysisDeleted(pendingDeleteOid);
    if (error) {
      setDeleteError(error);
      return;
    }
    setPendingDeleteOid(null);
  }

  function describeFilters(f: GameAnalysis['filters']): string {
    const timeLabel = TIME_LABELS[f.timeRange];
    const playersLabel = f.playerIds.length === 0
      ? 'All players'
      : f.playerIds.map(id => displayName(id, usersMap)).join(', ');
    return `${timeLabel} · ${playersLabel}`;
  }

  const sortedAnalyses = [...analyses].sort((a, b) => (b._tsu ?? 0) - (a._tsu ?? 0));

  return (
    <>
      <Paper sx={cardSx}>
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 600, mb: 1.5 }}>Summary Filters</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="ai-summary-time-label">Time Range</InputLabel>
          <Select
            labelId="ai-summary-time-label"
            label="Time Range"
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as GameAnalysisTimeRange)}
          >
            {(Object.keys(TIME_LABELS) as GameAnalysisTimeRange[]).map(key => (
              <MenuItem key={key} value={key}>{TIME_LABELS[key]}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 220 }} disabled={selectablePlayers.length === 0}>
          <InputLabel id="ai-summary-players-label">Players</InputLabel>
          <Select
            labelId="ai-summary-players-label"
            multiple
            value={playerIds}
            onChange={e => {
              const value = e.target.value;
              setPlayerIds(typeof value === 'string' ? value.split(',') : value);
            }}
            input={<OutlinedInput label="Players" />}
            renderValue={selected => (selected as string[]).length === 0
              ? 'All players'
              : (selected as string[]).map(id => displayName(id, usersMap)).join(', ')}
          >
            {selectablePlayers.map(p => (
              <MenuItem key={p.oid} value={p.oid}>
                <Checkbox checked={playerIds.indexOf(p.oid) > -1} />
                <ListItemText primary={p.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="outlined"
          size="small"
          onClick={handleGenerate}
          disabled={isLoading}
          sx={{
            borderColor: 'rgba(232,135,122,0.5)',
            color: '#cf6e62',
            fontSize: '0.8125rem',
            whiteSpace: 'nowrap',
            '&:hover': { borderColor: '#e8877a', background: 'rgba(232,135,122,0.06)' },
          }}
        >
          {currentAnalysis ? 'Update Analysis' : 'Analyze My Games'}
        </Button>
        </Box>
      </Paper>

      {isMobile ? (
        <Paper sx={{ ...cardSx, mb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            {sortedAnalyses.length > 0 ? (
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel id="ai-summary-history-label">Summaries</InputLabel>
                <Select
                  labelId="ai-summary-history-label"
                  label="Summaries"
                  value={currentAnalysis?.oid ?? ''}
                  onChange={e => {
                    const picked = sortedAnalyses.find(a => a.oid === e.target.value);
                    if (picked) { setTimeRange(picked.filters.timeRange); setPlayerIds(picked.filters.playerIds); }
                  }}
                >
                  {sortedAnalyses.map(a => (
                    <MenuItem key={a.oid} value={a.oid}>{describeFilters(a.filters)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, flex: 1 }}>Summary</Typography>
            )}
            <IconButton
              size="small"
              aria-label="Delete summary"
              disabled={!currentAnalysis}
              onClick={() => currentAnalysis && setPendingDeleteOid(currentAnalysis.oid!)}
              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
            >
              <TrashIcon style={{ width: '0.9rem', height: '0.9rem' }} />
            </IconButton>
          </Box>

          {isLoading && (
            <>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', fontStyle: 'italic', mb: 1.5 }}>
                Analyzing your games with AI…
              </Typography>
              <Box
                sx={{
                  height: '6px',
                  borderRadius: '3px',
                  background: 'linear-gradient(90deg, #f0a89f, #e8877a, #cf6e62, #e8877a, #f0a89f)',
                  backgroundSize: '200% auto',
                  animation: `${wave} 2s linear infinite`,
                }}
              />
            </>
          )}

          {!isLoading && !currentAnalysis && emptyResultContent && (
            <Box
              sx={{ fontSize: '0.9rem', color: 'text.secondary', '& p': { m: 0 } }}
              dangerouslySetInnerHTML={{ __html: emptyResultContent }}
            />
          )}

          {!isLoading && !currentAnalysis && !emptyResultContent && (
            <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
              No summary yet for these filters — click "Analyze My Games" to generate one.
            </Typography>
          )}

          {!isLoading && currentAnalysis && (
            <Box
              sx={{
                fontSize: '0.9375rem',
                lineHeight: 1.7,
                color: 'text.primary',
                '& h1, & h2, & h3, & h4': { mt: 2.0, mb: 0.75, fontSize: '1rem', fontWeight: 600, borderBottom: '2px solid rgba(235, 120, 152, 0.35)' },
                '& p': { mt: 0, mb: 1 },
                '& p:last-child': { mb: 0 },
                '& ul, & ol': { pl: '1.5rem', mt: 0, mb: 1 },
                '& li': { mb: 0.25 },
              }}
              dangerouslySetInnerHTML={{ __html: currentAnalysis.content }}
            />
          )}
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          <Paper sx={{ ...cardSx, width: '25%', flexShrink: 0, mb: 0 }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 1.5 }}>Summaries</Typography>
            {sortedAnalyses.length === 0 ? (
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                No summaries yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {sortedAnalyses.map(a => {
                  const isSelected = a.oid === currentAnalysis?.oid;
                  return (
                    <Box
                      key={a.oid}
                      onClick={() => { setTimeRange(a.filters.timeRange); setPlayerIds(a.filters.playerIds); }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        p: '0.5rem 0.75rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(232,135,122,0.12)' : 'transparent',
                        '&:hover': { background: isSelected ? 'rgba(232,135,122,0.12)' : 'rgba(232,135,122,0.06)' },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.85rem', color: 'text.primary', fontWeight: isSelected ? 600 : 400 }}>
                          {describeFilters(a.filters)}
                        </Typography>
                        {!!a._tsu && (
                          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                            {formatTimestamp(a._tsu)}
                          </Typography>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        aria-label="Delete summary"
                        onClick={e => { e.stopPropagation(); setPendingDeleteOid(a.oid!); }}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                      >
                        <TrashIcon style={{ width: '0.85rem', height: '0.85rem' }} />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>

          <Box sx={{ width: '75%', flexGrow: 1, minWidth: 0 }}>
            {isLoading && (
              <Box sx={cardSx}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', fontStyle: 'italic', mb: 1.5 }}>
                  Analyzing your games with AI…
                </Typography>
                <Box
                  sx={{
                    height: '6px',
                    borderRadius: '3px',
                    background: 'linear-gradient(90deg, #f0a89f, #e8877a, #cf6e62, #e8877a, #f0a89f)',
                    backgroundSize: '200% auto',
                    animation: `${wave} 2s linear infinite`,
                  }}
                />
              </Box>
            )}

            {!isLoading && !currentAnalysis && emptyResultContent && (
              <Box sx={cardSx}>
                <Box
                  sx={{ fontSize: '0.9rem', color: 'text.secondary', '& p': { m: 0 } }}
                  dangerouslySetInnerHTML={{ __html: emptyResultContent }}
                />
              </Box>
            )}

            {!isLoading && !currentAnalysis && !emptyResultContent && (
              <Box sx={cardSx}>
                <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                  No summary yet for these filters — click "Analyze My Games" to generate one.
                </Typography>
              </Box>
            )}

            {!isLoading && currentAnalysis && (
              <Paper sx={{ ...cardSx, mb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{describeFilters(currentAnalysis.filters)}</Typography>
                </Box>
                <Box
                  sx={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.7,
                    color: 'text.primary',
                    '& h1, & h2, & h3, & h4': { mt: 2.0, mb: 0.75, fontSize: '1rem', fontWeight: 600, borderBottom: '2px solid rgba(235, 120, 152, 0.35)' },
                    '& p': { mt: 0, mb: 1 },
                    '& p:last-child': { mb: 0 },
                    '& ul, & ol': { pl: '1.5rem', mt: 0, mb: 1 },
                    '& li': { mb: 0.25 },
                  }}
                  dangerouslySetInnerHTML={{ __html: currentAnalysis.content }}
                />
              </Paper>
            )}
          </Box>
        </Box>
      )}

      <Dialog open={!!pendingDeleteOid} onClose={() => { setPendingDeleteOid(null); setDeleteError(null); }}>
        <DialogTitle>Delete this summary?</DialogTitle>
        {deleteError && (
          <Box sx={{ px: 3, pb: 1 }}>
            <Alert severity="error" onClose={() => setDeleteError(null)}>{deleteError}</Alert>
          </Box>
        )}
        <DialogActions>
          <Button onClick={() => { setPendingDeleteOid(null); setDeleteError(null); }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
