import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const PINK = '#e8877a';
const GREEN = '#4caf82';
const DARK = '#1a1a1a';
const MUTED = 'rgba(0,0,0,0.42)';

const shadow = '0 4px 24px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.06)';
const cardRadius = '1rem';

/* ── tiny icon helpers ── */
function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function DollarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function TrophyIcon({ color = MUTED }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4" /><path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
      <path d="M12 17v4" /><path d="M8 21h8" />
      <path d="M6 5h12v5a6 6 0 0 1-12 0Z" />
    </svg>
  );
}
function PersonsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f0b429" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function BarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8877a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

/* ── Stat card ── */
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box sx={{
      background: '#fff',
      borderRadius: cardRadius,
      boxShadow: shadow,
      px: 1.75,
      py: 1.5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      minWidth: 148,
    }}>
      <Box>
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: DARK, lineHeight: 1 }}>
          {value}
        </Typography>
      </Box>
      <Box sx={{ opacity: 0.5 }}>{icon}</Box>
    </Box>
  );
}

/* ── Hand tile string ── */
function HandTiles({ tiles }: { tiles: { text: string; color: string }[] }) {
  return (
    <Box sx={{ display: 'flex', gap: '3px', alignItems: 'center', flexWrap: 'wrap' }}>
      {tiles.map((t, i) => (
        <Typography key={i} sx={{ fontSize: '0.65rem', fontWeight: 700, color: t.color }}>
          {t.text}
        </Typography>
      ))}
    </Box>
  );
}

/* ── Game row in the mock table ── */
function MockGameRow({
  player,
  tiles,
  jokers,
  winner,
}: {
  player: string;
  tiles: { text: string; color: string }[];
  jokers: number;
  winner?: boolean;
}) {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '1fr 1.8fr 0.5fr 0.5fr',
      gap: 0.5,
      alignItems: 'center',
      py: 0.75,
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <Box sx={{
        background: '#f9f9f9',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '0.4rem',
        px: 1,
        py: 0.4,
      }}>
        <Typography sx={{ fontSize: '0.6rem', color: DARK, fontWeight: 500 }}>{player}</Typography>
      </Box>
      <Box sx={{
        background: '#f9f9f9',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '0.4rem',
        px: 1,
        py: 0.5,
      }}>
        <HandTiles tiles={tiles} />
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.65rem', color: DARK, fontWeight: 600 }}>{jokers}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <TrophyIcon color={winner ? '#f0b429' : 'rgba(0,0,0,0.18)'} />
      </Box>
    </Box>
  );
}

/* ── Mini donut chart (pure SVG) ── */
function DonutChart() {
  const cx = 28; const cy = 28; const r = 20; const sw = 9;
  const circ = 2 * Math.PI * r;
  const segments = [
    { pct: 0.50, color: '#4caf82' },
    { pct: 0.33, color: PINK },
    { pct: 0.17, color: '#f0b429' },
  ];
  let offset = 0;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      {segments.map((s, i) => {
        const dash = s.pct * circ;
        const gap = circ - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={sw}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += s.pct;
        return el;
      })}
    </svg>
  );
}

/* ── Main component ── */
export default function HeroPreview() {
  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      maxWidth: 560,
      height: 420,
      flexShrink: 0,
    }}>

      {/* ── Stat cards (left column, stacked) ── */}
      <Box sx={{
        position: 'absolute',
        left: 0,
        top: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        zIndex: 3,
      }}>
        <StatCard icon={<BoltIcon />} label="Total Games" value="12" />
        <StatCard icon={<CheckIcon />} label="Win Rate" value="42%" />
        <StatCard icon={<DollarIcon />} label="Total Points Earned" value="18,450" />
        <StatCard icon={<ChartIcon />} label="Avg Jokers (Overall)" value="1.2" />
      </Box>

      {/* ── Category Distribution card ── */}
      <Box sx={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        background: '#fff',
        borderRadius: cardRadius,
        boxShadow: shadow,
        px: 1.75,
        py: 1.5,
        minWidth: 148,
        zIndex: 3,
      }}>
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: DARK, mb: 1 }}>
          Category Distribution (Overall)
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DonutChart />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            {[
              { color: '#4caf82', label: '2 Games', pct: '50%' },
              { color: PINK, label: '1 Game', pct: '33%' },
              { color: '#f0b429', label: '1 Win', pct: '17%' },
            ].map(({ color, label, pct }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.55rem', color: MUTED }}>{label}</Typography>
                <Typography sx={{ fontSize: '0.55rem', color: DARK, fontWeight: 700, ml: 'auto', pl: 1 }}>{pct}</Typography>
              </Box>
            ))}
            <Typography sx={{ fontSize: '0.5rem', color: 'rgba(0,0,0,0.28)', mt: 0.25 }}>Based on 12 games</Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Main app window ── */}
      <Box sx={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: '66%',
        background: '#fff',
        borderRadius: '1.25rem',
        boxShadow: '0 8px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        zIndex: 2,
      }}>
        {/* Window chrome */}
        <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: DARK }}>
            Mahj<Box component="span" sx={{ color: PINK }}>Up</Box>
          </Typography>
          <Box sx={{
            width: 22, height: 22, borderRadius: '50%',
            background: PINK,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ fontSize: '0.45rem', fontWeight: 800, color: '#fff' }}>MU</Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ px: 1.5, pt: 0.75, pb: 0, display: 'flex', gap: 1.5, borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          {['My Tracker', 'Summary', 'Card Reference'].map((tab, i) => (
            <Typography key={tab} sx={{
              fontSize: '0.58rem',
              fontWeight: i === 0 ? 700 : 500,
              color: i === 0 ? PINK : MUTED,
              pb: 0.75,
              borderBottom: i === 0 ? `2px solid ${PINK}` : '2px solid transparent',
            }}>
              {tab}
            </Typography>
          ))}
        </Box>

        {/* Session header */}
        <Box sx={{ px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: DARK }}>⌄ Session A ⌄</Typography>
          <Typography sx={{ fontSize: '0.55rem', color: MUTED }}>Tue, May 20 · East Round</Typography>
        </Box>

        {/* Table header */}
        <Box sx={{
          px: 1.5,
          pt: 0.75,
          display: 'grid',
          gridTemplateColumns: '1fr 1.8fr 0.5fr 0.5fr',
          gap: 0.5,
        }}>
          {['PLAYER', 'HAND', 'JOKERS', 'WINNER'].map(h => (
            <Typography key={h} sx={{ fontSize: '0.5rem', fontWeight: 700, color: MUTED, letterSpacing: '0.04em' }}>{h}</Typography>
          ))}
        </Box>

        {/* Game rows */}
        <Box sx={{ px: 1.5, pb: 0.5 }}>
          <MockGameRow player="Player One" jokers={2}
            tiles={[
              { text: '111', color: GREEN }, { text: '333', color: GREEN },
              { text: '5555', color: PINK }, { text: '666', color: PINK },
            ]} />
          <MockGameRow player="Player Two" jokers={3} winner
            tiles={[
              { text: '222', color: GREEN }, { text: '4444', color: PINK },
              { text: '777', color: '#1976d2' },
            ]} />
          <MockGameRow player="Guest 1" jokers={1}
            tiles={[
              { text: '11', color: GREEN }, { text: '22', color: GREEN },
              { text: '3333', color: PINK }, { text: '4444', color: PINK },
            ]} />
          <MockGameRow player="Guest 2" jokers={1}
            tiles={[
              { text: '555', color: '#1976d2' }, { text: '6666', color: PINK },
              { text: '7777', color: '#1976d2' },
            ]} />
        </Box>

        {/* Add links */}
        <Box sx={{ px: 1.5, pb: 1, display: 'flex', gap: 2 }}>
          <Typography sx={{ fontSize: '0.55rem', color: PINK, fontWeight: 600 }}>+ Add Player</Typography>
          <Typography sx={{ fontSize: '0.55rem', color: PINK, fontWeight: 600 }}>+ Add Game</Typography>
        </Box>

        {/* Bottom stats bar */}
        <Box sx={{
          borderTop: '1px solid rgba(0,0,0,0.07)',
          px: 1.5,
          py: 1,
          display: 'flex',
          justifyContent: 'space-around',
          background: '#fff',
        }}>
          {[
            { icon: <PersonsIcon />, value: '4', label: 'Players' },
            { icon: <TrophyIcon color="#f0b429" />, value: '1', label: 'Winner' },
            { icon: <StarIcon />, value: '18,450', label: 'Top Score' },
            { icon: <BarIcon />, value: '12', label: 'Games' },
          ].map(({ icon, value, label }) => (
            <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
              {icon}
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: DARK }}>{value}</Typography>
              <Typography sx={{ fontSize: '0.5rem', color: MUTED }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Card Reference floating panel ── */}
      <Box sx={{
        position: 'absolute',
        right: -16,
        bottom: 20,
        width: '50%',
        background: '#fff',
        borderRadius: cardRadius,
        boxShadow: shadow,
        px: 1.5,
        py: 1.25,
        zIndex: 4,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: DARK }}>Card Reference</Typography>
          <Box sx={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: '0.35rem', px: 0.75, py: 0.2 }}>
            <Typography sx={{ fontSize: '0.5rem', color: MUTED }}>All Categories ▾</Typography>
          </Box>
        </Box>

        {[
          { category: 'CONSECUTIVE RUN', count: '8 Hands', hand: '11 22 33 44 5555', score: '25' },
          { category: 'ANY LIKE NUMBERS', count: '3 Hands', hand: '1111 FFFFFF 1111', score: '30' },
          { category: 'WINDS - DRAGONS', count: '8 Hands', hand: 'NNNN EEE WWW SSSS', score: '25' },
        ].map(({ category, count, hand, score }) => (
          <Box key={category} sx={{ mb: 0.75, pb: 0.75, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
              <Typography sx={{ fontSize: '0.52rem', fontWeight: 700, color: DARK, letterSpacing: '0.03em' }}>{category}</Typography>
              <Typography sx={{ fontSize: '0.5rem', color: MUTED }}>{count}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.55rem', color: PINK, fontWeight: 600 }}>{hand}</Typography>
              <Typography sx={{ fontSize: '0.55rem', color: DARK, fontWeight: 700 }}>X {score}</Typography>
            </Box>
          </Box>
        ))}

        <Typography sx={{ fontSize: '0.55rem', color: PINK, fontWeight: 600 }}>View all categories</Typography>
      </Box>
    </Box>
  );
}
