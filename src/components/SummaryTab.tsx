import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import type { GameRecord } from '../../model/game.model';

interface SummaryTabProps {
  records: GameRecord[];
  currentUserOid: string;
}

const statCards = [
  {
    labelColor: 'rgba(46,94,66,0.6)',
    label: 'Total Games',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '4rem', height: '4rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    valueKey: 'total' as const,
  },
  {
    labelColor: '#e8877a',
    label: 'Win Rate',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '4rem', height: '4rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    valueKey: 'winRate' as const,
  },
  {
    labelColor: '#0d4a2f',
    label: 'Total Points Earned',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '4rem', height: '4rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    valueKey: 'points' as const,
  },
  {
    labelColor: '#5b3fa0',
    label: 'Avg Points Per Win',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '4rem', height: '4rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    valueKey: 'avgPoints' as const,
  },
  {
    labelColor: '#b07d2e',
    label: 'Avg Jokers (Wins)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '4rem', height: '4rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    valueKey: 'avgWinJokers' as const,
  },
  {
    labelColor: '#2e7a8c',
    label: 'Avg Jokers (Overall)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '4rem', height: '4rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    valueKey: 'avgAllJokers' as const,
  },
];

export default function SummaryTab({ records, currentUserOid }: SummaryTabProps) {
  const valid = records.filter(d => d.players?.some(p => p.userId === currentUserOid));
  const wins = valid.filter(d => d.players.some(p => p.isWinner && p.userId === currentUserOid));
  const total = valid.length;
  const points = wins.reduce((acc, d) => {
    const myWin = d.players.find(p => p.isWinner && p.userId === currentUserOid);
    return acc + (myWin?.score ?? 0);
  }, 0);
  const winRate = total > 0 ? `${Math.round((wins.length / total) * 100)}%` : '0%';
  const avgPoints = wins.length > 0 ? Math.round(points / wins.length) : 0;
  const avgWinJokers = wins.length > 0
    ? (wins.reduce((acc, d) => {
        const mine = d.players.find(p => p.isWinner && p.userId === currentUserOid);
        return acc + (mine?.jokers ?? 0);
      }, 0) / wins.length).toFixed(1)
    : '—';
  const avgAllJokers = total > 0
    ? (valid.reduce((acc, d) => {
        const mine = d.players.find(p => p.userId === currentUserOid);
        return acc + (mine?.jokers ?? 0);
      }, 0) / total).toFixed(1)
    : '—';

  const counts: Record<string, number> = {};
  valid.forEach(d => {
    const mine = d.players.find(p => p.userId === currentUserOid);
    if (mine?.category) counts[mine.category] = (counts[mine.category] ?? 0) + 1;
  });

  const winCounts: Record<string, number> = {};
  wins.forEach(d => {
    const mine = d.players.find(p => p.isWinner && p.userId === currentUserOid);
    if (mine?.category) winCounts[mine.category] = (winCounts[mine.category] ?? 0) + 1;
  });

  const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const sortedWinCounts = Object.entries(winCounts).sort((a, b) => b[1] - a[1]);

  const values = { total, winRate, points, avgPoints, avgWinJokers, avgAllJokers };

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map(stat => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              sx={{
                p: '2rem',
                borderRadius: '1.5rem',
                border: '1px solid rgba(232,135,122,0.12)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover .stat-icon-bg': { transform: 'scale(1.1)' },
              }}
            >
              <Box
                className="stat-icon-bg"
                sx={{ position: 'absolute', top: 0, right: 0, p: '1rem', opacity: 0.05, transition: 'transform 0.2s' }}
              >
                {stat.icon}
              </Box>
              <Typography
                sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5, color: stat.labelColor }}
              >
                {stat.label}
              </Typography>
              <Typography sx={{ fontSize: '3rem', fontWeight: 900, color: 'text.primary', letterSpacing: '-0.05em', lineHeight: 1 }}>
                {values[stat.valueKey]}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(232,135,122,0.12)', height: '100%' }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: 'text.primary', mb: 3, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Box sx={{ width: '0.5rem', height: '1.5rem', background: 'rgba(46,94,66,0.6)', borderRadius: '9999px', flexShrink: 0 }} />
              Overall Category Distribution
            </Typography>
            {sortedCounts.length === 0 ? (
              <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>No games played yet.</Typography>
            ) : (
              <Grid container spacing={2}>
                {sortedCounts.map(([cat, count]) => (
                  <Grid key={cat} size={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', mb: '0.375rem' }}>
                      <span>{cat}</span>
                      <span>{count} game{count !== 1 ? 's' : ''}</span>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={total > 0 ? (count / total) * 100 : 0}
                      sx={{ '& .MuiLinearProgress-bar': { background: 'rgba(46,94,66,0.6)' } }}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(232,135,122,0.12)', height: '100%' }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: 'text.primary', mb: 3, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Box sx={{ width: '0.5rem', height: '1.5rem', background: '#e8877a', borderRadius: '9999px', flexShrink: 0 }} />
              Win Category Distribution
            </Typography>
            {sortedWinCounts.length === 0 ? (
              <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>No wins recorded yet.</Typography>
            ) : (
              <Grid container spacing={2}>
                {sortedWinCounts.map(([cat, count]) => (
                  <Grid key={cat} size={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', mb: '0.375rem' }}>
                      <span>{cat}</span>
                      <span>{count} win{count !== 1 ? 's' : ''}</span>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={wins.length > 0 ? (count / wins.length) * 100 : 0}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
