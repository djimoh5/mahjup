import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import type { MahjSession } from '../../model/mahj-session.model';
import type { GameRecord } from '../../model/game.model';
import type { UserSummary } from '../../model/user.model';
import { TrophyIcon, ChevronDownIcon } from './icons/Icons';
import { resolveDisplayName } from '../utils/user';

interface AdminSessionCardProps {
  session: MahjSession;
  games: GameRecord[];
  usersMap: Record<string, UserSummary>;
  isExpanded: boolean;
  onToggle: () => void;
}

function formatDateTime(dt: string): string {
  if (!dt) return '—';
  const [datePart] = dt.split('T');
  const [y, m, d] = datePart.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  const dayName = days[date.getDay()];
  const monthName = months[parseInt(m) - 1];
  return `${dayName}, ${monthName} ${parseInt(d)}`;
}

export default function AdminSessionCard({ session, games, usersMap, isExpanded, onToggle }: AdminSessionCardProps) {
  return (
    <Paper sx={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(242,171,164,0.55)' }}>
      <ButtonBase
        onClick={onToggle}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          width: '100%',
          px: '1rem',
          py: '0.875rem',
          borderBottom: isExpanded ? '1px solid rgba(242,171,164,0.55)' : 'none',
          flexWrap: 'wrap',
          textAlign: 'left',
        }}
      >
        <ChevronDownIcon
          style={{
            width: '1rem',
            height: '1rem',
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: isExpanded ? 'none' : 'rotate(-90deg)',
            color: 'rgba(0,0,0,0.54)',
          }}
        />
        {session.title && (
          <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
            {session.title}
          </Typography>
        )}
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
          {formatDateTime(session.dateTime)}
        </Typography>
        {session.userId && (
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
            Created by <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{resolveDisplayName(session.userId, usersMap)}</Box>
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {session.players.map(p => (
            <Chip key={p} label={resolveDisplayName(p, usersMap)} size="small" />
          ))}
        </Box>
        <Chip label={`${games.length} game${games.length === 1 ? '' : 's'}`} size="small" variant="outlined" sx={{ ml: 'auto' }} />
      </ButtonBase>

      {isExpanded && (
      <Box sx={{ p: '0.75rem' }}>
        {games.length === 0 ? (
          <Box sx={{ p: '1rem', textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
            No games in this session.
          </Box>
        ) : (
          <Stack spacing={1}>
            {games.map((game, i) => {
              const winner = game.players.find(p => p.isWinner);
              return (
                <Paper key={game.oid} elevation={0} variant="outlined" sx={{ borderRadius: '0.75rem', p: '0.75rem 1rem', background: '#ffffff' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Game {i + 1}
                    </Typography>
                    {winner ? (
                      <>
                        <TrophyIcon filled style={{ width: '0.875rem', height: '0.875rem', color: '#c9920a', flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {resolveDisplayName(winner.userId, usersMap)}
                        </Typography>
                        {winner.hand && (
                          <Typography variant="body2" color="text.secondary">· {winner.hand}</Typography>
                        )}
                        {winner.score > 0 && (
                          <Chip label={`${winner.score}pts`} size="small" color="success" sx={{ fontWeight: 700 }} />
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.disabled"><em>No winner set</em></Typography>
                    )}
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                  <Stack spacing={0.5}>
                    {game.players.map((p, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', fontSize: '0.8125rem' }}>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, minWidth: 120 }}>
                          {p.userId ? resolveDisplayName(p.userId, usersMap) : '—'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                          {p.category || '—'}{p.hand ? ` · ${p.hand}` : ''}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                          {p.jokers ?? 0} joker{p.jokers === 1 ? '' : 's'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                          {p.score ?? 0} pts
                        </Typography>
                        {p.isWinner && <Chip label="Winner" size="small" color="success" />}
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
      )}
    </Paper>
  );
}
