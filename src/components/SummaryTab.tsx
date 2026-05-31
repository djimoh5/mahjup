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

  const counts: Record<string, number> = {};
  valid.forEach(d => {
    const mine = d.players.find(p => p.userId === currentUserOid);
    if (mine?.category) counts[mine.category] = (counts[mine.category] ?? 0) + 1;
  });

  const values = { total, winRate, points };

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map(stat => (
          <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
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

      <Paper sx={{ p: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(232,135,122,0.12)' }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'text.primary', mb: 3, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Box sx={{ width: '0.5rem', height: '1.5rem', background: '#e8877a', borderRadius: '9999px', flexShrink: 0 }} />
          Category Distribution
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(counts).map(([cat, count]) => (
            <Grid key={cat} size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', mb: '0.5rem' }}>
                <span>{cat}</span>
                <span>{count} games</span>
              </Box>
              <LinearProgress
                variant="determinate"
                value={total > 0 ? (count / total) * 100 : 0}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>
    </>
  );
}
