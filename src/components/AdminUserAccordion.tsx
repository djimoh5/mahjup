import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import type { UserSummary } from '../../model/user.model';
import type { MahjSession } from '../../model/mahj-session.model';
import type { GameRecord } from '../../model/game.model';
import type { GameAnalysis } from '../../model/game-analysis.model';
import { ChevronDownIcon } from './icons/Icons';
import { resolveDisplayName } from '../utils/user';
import AdminSessionCard from './AdminSessionCard';
import AdminAnalysisCard from './AdminAnalysisCard';

interface AdminUserAccordionProps {
  user: UserSummary;
  isExpanded: boolean;
  onToggle: () => void;
  sessions: MahjSession[];
  records: GameRecord[];
  analyses: GameAnalysis[];
  usersMap: Record<string, UserSummary>;
}

export default function AdminUserAccordion({ user, isExpanded, onToggle, sessions, records, analyses, usersMap }: AdminUserAccordionProps) {
  const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null);

  const userSessions = sessions
    .filter(s =>
      s.userId === user.oid ||
      s.players.includes(user.oid) ||
      records.some(r => r.sessionId === s.oid && r.players.some(p => p.userId === user.oid))
    )
    .sort((a, b) => b.dateTime.localeCompare(a.dateTime));

  const userAnalyses = analyses
    .filter(a => a.userId === user.oid)
    .sort((a, b) => (b._tsu ?? 0) - (a._tsu ?? 0));

  const gameCount = records.filter(r => r.players.some(p => p.userId === user.oid)).length;

  return (
    <Paper sx={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(242,171,164,0.55)' }}>
      <ButtonBase
        onClick={onToggle}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          width: '100%',
          px: '1.25rem',
          py: '1rem',
          textAlign: 'left',
        }}
      >
        <ChevronDownIcon
          style={{
            width: '1.125rem',
            height: '1.125rem',
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: isExpanded ? 'none' : 'rotate(-90deg)',
            color: 'rgba(0,0,0,0.54)',
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary' }}>
            {resolveDisplayName(user.oid, usersMap)}
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            {user.username}
          </Typography>
        </Box>
        <Chip label={`${gameCount} game${gameCount === 1 ? '' : 's'}`} size="small" />
        <Chip label={`${userSessions.length} session${userSessions.length === 1 ? '' : 's'}`} size="small" />
      </ButtonBase>

      {isExpanded && (
        <Box sx={{ px: '1.25rem', pb: '1.25rem', borderTop: '1px solid rgba(242,171,164,0.55)', pt: '1rem' }}>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
            AI Insights ({userAnalyses.length})
          </Typography>
          {userAnalyses.length === 0 ? (
            <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 3 }}>
              No AI insights generated yet.
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mb: 3 }}>
              {userAnalyses.map(analysis => {
                const itemKey = `analysis:${analysis.oid}`;
                return (
                  <AdminAnalysisCard
                    key={analysis.oid}
                    analysis={analysis}
                    usersMap={usersMap}
                    isExpanded={expandedItemKey === itemKey}
                    onToggle={() => setExpandedItemKey(k => k === itemKey ? null : itemKey)}
                  />
                );
              })}
            </Stack>
          )}

          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
            Sessions ({userSessions.length})
          </Typography>
          {userSessions.length === 0 ? (
            <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              No sessions yet.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {userSessions.map(session => {
                const itemKey = `session:${session.oid}`;
                return (
                  <AdminSessionCard
                    key={session.oid}
                    session={session}
                    games={records.filter(r => r.sessionId === session.oid)}
                    usersMap={usersMap}
                    isExpanded={expandedItemKey === itemKey}
                    onToggle={() => setExpandedItemKey(k => k === itemKey ? null : itemKey)}
                  />
                );
              })}
            </Stack>
          )}
        </Box>
      )}
    </Paper>
  );
}
