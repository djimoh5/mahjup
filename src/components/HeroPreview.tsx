import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const PINK = '#e8877a';
const GREEN = '#4caf82';
const BLUE = '#0e2c6e';
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
      minWidth: 0,
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
    { pct: 0.40, color: '#4caf82' },
    { pct: 0.20, color: PINK },
    { pct: 0.30, color: '#f0b429' },
    { pct: 0.10, color: '#f02929' },
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
      maxWidth: 720,
      height: 440,
      flexShrink: 0,
    }}>

      {/* ── Stat cards (2x2 below tracker) ── */}
      <Box sx={{
        position: 'absolute',
        left: 70,
        top: 308,
        width: 330,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1,
        zIndex: 3,
      }}>
        <StatCard icon={<BoltIcon />} label="Total Games" value="29" />
        <StatCard icon={<CheckIcon />} label="Win Rate" value="42%" />
        <StatCard icon={<DollarIcon />} label="Total Points" value="235" />
        <StatCard icon={<ChartIcon />} label="Avg Jokers" value="1.2" />
      </Box>

      {/* ── Main app window ── */}
      <Box sx={{
        position: 'absolute',
        left: 70,
        top: 0,
        right: 226,
        height: 300,
        width: 330,
        background: '#fff',
        borderRadius: '1.25rem',
        boxShadow: '0 8px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
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
            <Typography sx={{ fontSize: '0.45rem', fontWeight: 800, color: '#fff' }}>FP</Typography>
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
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: DARK }}>Tuesday Night Mahj</Typography>
          <Typography sx={{ fontSize: '0.55rem', color: MUTED }}>Tue, May 20</Typography>
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
          <MockGameRow player="Francis P." jokers={2}
            tiles={[
              { text: '222', color: GREEN }, { text: '444', color: GREEN },
              { text: '6666', color: PINK }, { text: '8888', color: PINK },
            ]} />
          <MockGameRow player="Catherine C." jokers={3} winner
            tiles={[
              { text: '111', color: GREEN }, { text: '222', color: GREEN },
              { text: '3333', color: PINK }, { text: '4444', color: PINK },
            ]} />
          <MockGameRow player="Lane T." jokers={1}
            tiles={[
              { text: '11', color: BLUE }, { text: '333', color: BLUE },
              { text: '55', color: BLUE }, { text: '777', color: BLUE }, { text: '9999', color: BLUE },
            ]} />
          <MockGameRow player="Ruth R." jokers={1}
            tiles={[
              { text: '1111', color: GREEN }, { text: 'FFFFFF', color: BLUE },
              { text: '1111', color: PINK },
            ]} />
        </Box>

        {/* Add links */}
        <Box sx={{ px: 1.5, pb: 1, display: 'flex', gap: 2 }}>
          <Typography sx={{ fontSize: '0.55rem', color: PINK, fontWeight: 600 }}>+ Add Player</Typography>
        </Box>

      </Box>

      {/* ── Right column: Donut + Card Reference ── */}
      <Box sx={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: 224,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        zIndex: 3,
      }}>
        {/* Category Distribution */}
        <Box sx={{ background: '#fff', borderRadius: cardRadius, boxShadow: shadow, px: 1.75, py: 1.5 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: DARK, mb: 1 }}>
            Category Distribution
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DonutChart />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
              {[
                { color: GREEN, label: '2468', pct: '40%' },
                { color: PINK, label: 'Consec. Run', pct: '20%' },
                { color: '#f0b429', label: 'Winds - Dragons', pct: '30%' },
                { color: '#f02929', label: '369', pct: '10%' },
              ].map(({ color, label, pct }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.55rem', color: MUTED }}>{label}</Typography>
                  <Typography sx={{ fontSize: '0.55rem', color: DARK, fontWeight: 700, ml: 'auto', pl: 1 }}>{pct}</Typography>
                </Box>
              ))}
              <Typography sx={{ fontSize: '0.5rem', color: 'rgba(0,0,0,0.28)', mt: 0.25 }}>Based on 29 games</Typography>
            </Box>
          </Box>
        </Box>

        {/* Card Reference */}
        <Box sx={{ background: '#fff', borderRadius: cardRadius, boxShadow: shadow, px: 1.5, py: 1.25, flex: 1, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: DARK }}>2026</Typography>
            <Box sx={{ background: '#f5f5f5', borderRadius: '99px', px: 0.9, py: 0.25 }}>
              <Typography sx={{ fontSize: '0.5rem', color: MUTED, fontWeight: 600 }}>4 Hands</Typography>
            </Box>
          </Box>
          {([
            { score: 25, d: 'Any 2 Suits', s: [{ t: '222', c: 'green' }, { t: '000', c: 'blue' }, { t: '2222', c: 'red' }, { t: '6666', c: 'red' }] },
            { score: 25, d: 'Any 2 Suits w Matching Dragons', s: [{ t: '2026', c: 'green' }, { t: 'DDD', c: 'green' }, { t: '2222', c: 'red' }, { t: 'DDD', c: 'red' }] },
            { score: 25, d: 'Any 3 Suits', s: [{ t: 'FFF', c: 'blue' }, { t: '2026', c: 'green' }, { t: '222', c: 'red' }, { t: '6666', c: 'blue' }] },
            { score: 30, d: 'Any 2 Suits', s: [{ t: '22', c: 'green' }, { t: '00', c: 'blue' }, { t: '222', c: 'red' }, { t: '666', c: 'red' }, { t: 'NEWS', c: 'blue' }] },
          ] as { score: number; d: string; s: { t: string; c: string }[] }[]).map(({ score, d, s }, i, arr) => (
            <Box key={i} sx={{ mb: 0.6, pb: 0.6, borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {s.map((seg, j) => (
                    <Typography key={j} sx={{ fontSize: '0.6rem', fontWeight: 700, color: seg.c === 'green' ? GREEN : seg.c === 'red' ? PINK : BLUE }}>
                      {seg.t}
                    </Typography>
                  ))}
                </Box>
                <Typography sx={{ fontSize: '0.5rem', color: MUTED, fontStyle: 'italic', mt: 0.2 }}>({d})</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, ml: 1 }}>
                <Typography sx={{ fontSize: '0.55rem', color: PINK, fontWeight: 700 }}>X</Typography>
                <Typography sx={{ fontSize: '0.55rem', color: DARK, fontWeight: 800 }}>{score}</Typography>
              </Box>
            </Box>
          ))}
          <Typography sx={{ fontSize: '0.55rem', color: PINK, fontWeight: 600 }}>View all categories</Typography>
        </Box>
      </Box>
    </Box>
  );
}
