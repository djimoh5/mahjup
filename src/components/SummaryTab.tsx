import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { GameRecord } from '../../model/game.model';

interface SummaryTabProps {
  records: GameRecord[];
  currentUserOid: string;
}

const statCards = [
  {
    labelColor: '#e8877a',
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
    labelColor: '#5b3fa0',
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
    labelColor: '#b07d2e',
    label: 'Avg Jokers (Overall)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '4rem', height: '4rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    valueKey: 'avgAllJokers' as const,
  },
];

const PIE_COLORS = ['#e8877a', '#5b3fa0', '#b07d2e', '#2e5e42', '#4a90d9', '#c45c9e', '#3d8b6f', '#d4732e'];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function PieChart({ data }: { data: [string, number][] }) {
  const total = data.reduce((acc, [, n]) => acc + n, 0);
  const cx = 75, cy = 75, r = 65;
  const innerR = r * 0.42;
  const labelR = (r + innerR) / 2;
  let cumAngle = 0;

  const slices = data.map(([cat, count], i) => {
    const angle = (count / total) * 360;
    const startAngle = cumAngle;
    const midAngle = cumAngle + angle / 2;
    cumAngle += angle;
    const pct = Math.round((count / total) * 100);
    const labelPos = polarToCartesian(cx, cy, labelR, midAngle);
    return { cat, count, i, startAngle, endAngle: cumAngle, pct, labelPos };
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg width={150} height={150} viewBox="0 0 150 150">
        {data.length === 1 ? (
          <>
            <circle cx={cx} cy={cy} r={r} fill={PIE_COLORS[0]} />
            <circle cx={cx} cy={cy} r={innerR} fill="var(--mui-palette-background-paper, #1e1e2e)" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="13" fontWeight="700">100%</text>
          </>
        ) : (
          <>
            {slices.map(({ cat, startAngle, endAngle, i }) => (
              <path key={cat} d={slicePath(cx, cy, r, startAngle, endAngle)} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
            <circle cx={cx} cy={cy} r={innerR} fill="var(--mui-palette-background-paper, #1e1e2e)" />
            {slices.map(({ cat, pct, labelPos }) => pct >= 8 && (
              <text
                key={cat + '_label'}
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="11"
                fontWeight="700"
                style={{ pointerEvents: 'none' }}
              >
                {pct}%
              </text>
            ))}
          </>
        )}
      </svg>
      <Box sx={{ width: '100%' }}>
        {data.map(([cat], i) => (
          <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.3 }}>
              {cat}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function SummaryTab({ records, currentUserOid }: SummaryTabProps) {
  const valid = records.filter(d => d.players?.some(p => p.userId === currentUserOid));
  const wins = valid.filter(d => d.players.some(p => p.isWinner && p.userId === currentUserOid));
  const losses = valid.filter(d => !d.players.some(p => p.isWinner && p.userId === currentUserOid));
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

  const lossCounts: Record<string, number> = {};
  losses.forEach(d => {
    const mine = d.players.find(p => p.userId === currentUserOid);
    if (mine?.category) lossCounts[mine.category] = (lossCounts[mine.category] ?? 0) + 1;
  });

  const winHandCounts: Record<string, number> = {};
  wins.forEach(d => {
    const mine = d.players.find(p => p.isWinner && p.userId === currentUserOid);
    if (mine?.hand) winHandCounts[mine.hand] = (winHandCounts[mine.hand] ?? 0) + 1;
  });

  const lossHandCounts: Record<string, number> = {};
  losses.forEach(d => {
    const mine = d.players.find(p => p.userId === currentUserOid);
    if (mine?.hand) lossHandCounts[mine.hand] = (lossHandCounts[mine.hand] ?? 0) + 1;
  });

  const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const sortedWinCounts = Object.entries(winCounts).sort((a, b) => b[1] - a[1]);
  const sortedLossCounts = Object.entries(lossCounts).sort((a, b) => b[1] - a[1]);
  const topWinHands = Object.entries(winHandCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topLossHands = Object.entries(lossHandCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const values = { total, winRate, points, avgPoints, avgWinJokers, avgAllJokers };

  const pieCardSx = {
    p: '2rem',
    borderRadius: '1.5rem',
    border: '1px solid rgba(232,135,122,0.12)',
    height: '100%',
  };

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
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={pieCardSx}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
              Category Distribution Overall
            </Typography>
            {sortedCounts.length === 0 ? (
              <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>No games played yet.</Typography>
            ) : (
              <PieChart data={sortedCounts} />
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={pieCardSx}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
              Category Distribution on Wins
            </Typography>
            {sortedWinCounts.length === 0 ? (
              <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>No wins recorded yet.</Typography>
            ) : (
              <PieChart data={sortedWinCounts} />
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={pieCardSx}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
              Category Distribution on Losses
            </Typography>
            {sortedLossCounts.length === 0 ? (
              <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>No losses recorded yet.</Typography>
            ) : (
              <PieChart data={sortedLossCounts} />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        {([
          { title: 'Top 3 Hands (Wins)', hands: topWinHands, empty: 'No wins with hand data yet.' },
          { title: 'Bottem 3 Hands (Losses)', hands: topLossHands, empty: 'No losses with hand data yet.' },
        ] as const).map(({ title, hands, empty }) => (
          <Grid key={title} size={{ xs: 12, md: 6 }}>
            <Paper sx={pieCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
                {title}
              </Typography>
              {hands.length === 0 ? (
                <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>{empty}</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {hands.map(([hand, count], i) => {
                    const medals = ['#b07d2e', '#9e9e9e', '#a0522d'] as const;
                    const ranks = ['1st', '2nd', '3rd'] as const;
                    return (
                      <Box
                        key={hand}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: '0.875rem 1rem',
                          borderRadius: '0.875rem',
                          background: `rgba(${i === 0 ? '176,125,46' : i === 1 ? '158,158,158' : '160,82,45'}, 0.08)`,
                          border: `1px solid rgba(${i === 0 ? '176,125,46' : i === 1 ? '158,158,158' : '160,82,45'}, 0.2)`,
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: medals[i],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 900, color: '#fff', letterSpacing: '0.03em' }}>
                            {ranks[i]}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary', flex: 1, lineHeight: 1.3 }}>
                          {hand}
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: medals[i], whiteSpace: 'nowrap' }}>
                          {count}×
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
