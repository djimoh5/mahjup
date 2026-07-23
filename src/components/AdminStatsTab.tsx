import { useMemo } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip as ChartTooltip } from 'chart.js';
import type { UserSummary } from '../../model/user.model';
import type { MahjSession } from '../../model/mahj-session.model';
import type { GameRecord } from '../../model/game.model';
import type { GameAnalysis } from '../../model/game-analysis.model';
import type { Invite } from '../../model/invite.model';
import { resolveDisplayName } from '../utils/user';

ChartJS.register(BarElement, CategoryScale, LinearScale, ChartTooltip);

interface AdminStatsTabProps {
  users: UserSummary[];
  sessions: MahjSession[];
  records: GameRecord[];
  analyses: GameAnalysis[];
  invites: Invite[];
}

const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKS_TO_SHOW = 8;

const MEDAL_COLORS = ['#b07d2e', '#9e9e9e', '#a0522d'] as const;
const MEDAL_RANKS = ['1st', '2nd', '3rd'] as const;

const cardSx = {
  p: '2rem',
  borderRadius: '1.5rem',
  border: '1px solid rgba(232,135,122,0.12)',
  height: '100%',
};

function computeActiveUserOids(sessions: MahjSession[], records: GameRecord[], analyses: GameAnalysis[], cutoff: number): Set<string> {
  const active = new Set<string>();
  for (const s of sessions) {
    if (s.userId && (s._tsu ?? 0) >= cutoff) active.add(s.userId);
  }
  for (const r of records) {
    if (r.userId && (r._tsu ?? 0) >= cutoff) active.add(r.userId);
  }
  for (const a of analyses) {
    if (a.userId && (a._tsu ?? 0) >= cutoff) active.add(a.userId);
  }
  return active;
}

function computeUnregisteredCount(users: UserSummary[]): number {
  return users.filter(u => u.virtual).length;
}

function formatWeekLabel(ts: number): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date(ts);
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function bucketByWeek(timestamps: number[], weeks: number, includeEarlier = true): { label: string; count: number }[] {
  const now = Date.now();
  const windowStart = now - weeks * WEEK_MS;
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = now - (weeks - i) * WEEK_MS;
    return { start, end: start + WEEK_MS, count: 0 };
  });
  let earlierCount = 0;
  for (const ts of timestamps) {
    if (ts < windowStart) {
      earlierCount++;
      continue;
    }
    (buckets.find(b => ts >= b.start && ts < b.end) ?? buckets[buckets.length - 1]).count++;
  }
  const weekly = buckets.map(b => ({ label: formatWeekLabel(b.start), count: b.count }));
  return includeEarlier && earlierCount > 0 ? [{ label: 'Earlier', count: earlierCount }, ...weekly] : weekly;
}

function computeMostPopularCategory(records: GameRecord[]): { category: string; count: number } | null {
  const counts: Record<string, number> = {};
  for (const r of records) {
    for (const p of r.players ?? []) {
      if (p.category) counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  const [category, count] = entries[0];
  return { category, count };
}

function computeSessionCreatorCounts(sessions: MahjSession[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    if (s.userId) counts[s.userId] = (counts[s.userId] ?? 0) + 1;
  }
  return counts;
}

function computeConnectionCounts(users: UserSummary[], records: GameRecord[], invites: Invite[]): Record<string, number> {
  const usernameToOid: Record<string, string> = {};
  for (const u of users) usernameToOid[u.username.toLowerCase()] = u.oid;

  const connections: Record<string, Set<string>> = {};
  function connect(a: string, b: string) {
    if (!a || !b || a === b) return;
    if (!connections[a]) connections[a] = new Set();
    connections[a].add(b);
  }

  for (const r of records) {
    const ids = (r.players ?? []).map(p => p.userId).filter(Boolean);
    for (const a of ids) {
      for (const b of ids) connect(a, b);
    }
  }

  for (const inv of invites) {
    const inviteeOid = usernameToOid[inv.username?.toLowerCase()];
    if (inv.invitedBy && inviteeOid) {
      connect(inv.invitedBy, inviteeOid);
      connect(inviteeOid, inv.invitedBy);
    }
  }

  return Object.fromEntries(Object.entries(connections).map(([oid, set]) => [oid, set.size]));
}

function StatTile({ label, value, subtitle, valueSize = '2.25rem' }: { label: string; value: string; subtitle?: string; valueSize?: string }) {
  return (
    <Paper
      sx={{
        p: '2rem',
        borderRadius: '1.5rem',
        border: '1px solid rgba(232,135,122,0.12)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5, color: '#e8877a' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: valueSize, fontWeight: 900, color: 'text.primary', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}

function WeeklyBarChart({ title, buckets, color }: { title: string; buckets: { label: string; count: number }[]; color: string }) {
  const chartData = {
    labels: buckets.map(b => b.label),
    datasets: [
      {
        data: buckets.map(b => b.count),
        backgroundColor: color,
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { displayColors: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
    },
  };

  return (
    <Paper sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        {title}
      </Typography>
      <Box sx={{ height: 220 }}>
        <Bar data={chartData} options={options} />
      </Box>
    </Paper>
  );
}

function LeaderboardCard({
  title, entries, usersMap, countLabel,
}: {
  title: string;
  entries: [string, number][];
  usersMap: Record<string, UserSummary>;
  countLabel: (n: number) => string;
}) {
  return (
    <Paper sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        {title}
      </Typography>
      {entries.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>No data yet.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {entries.slice(0, 3).map(([oid, count], i) => (
            <Box key={oid} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '0.4rem 1rem', borderRadius: '0.875rem' }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: MEDAL_COLORS[i],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 900, color: '#fff', letterSpacing: '0.03em' }}>
                  {MEDAL_RANKS[i]}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary', flex: 1, lineHeight: 1.3 }}>
                {resolveDisplayName(oid, usersMap)}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: MEDAL_COLORS[i], whiteSpace: 'nowrap' }}>
                {countLabel(count)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default function AdminStatsTab({ users, sessions, records, analyses, invites }: AdminStatsTabProps) {
  const usersMap = useMemo(() => Object.fromEntries(users.map(u => [u.oid, u])), [users]);

  const sessionCreatorEntries = useMemo(() => {
    const counts = computeSessionCreatorCounts(sessions);
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [sessions]);

  const connectionEntries = useMemo(() => {
    const counts = computeConnectionCounts(users, records, invites);
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [users, records, invites]);

  const registeredUsers = useMemo(() => users.filter(u => !u.virtual), [users]);

  const activeUserCount = useMemo(() => {
    const cutoff = Date.now() - ACTIVE_WINDOW_MS;
    const registeredOids = new Set<string>(registeredUsers.map(u => u.oid));
    const active = computeActiveUserOids(sessions, records, analyses, cutoff);
    return [...active].filter(oid => registeredOids.has(oid)).length;
  }, [sessions, records, analyses, registeredUsers]);

  const unregisteredCount = useMemo(() => computeUnregisteredCount(users), [users]);

  const mostPopularCategory = useMemo(() => computeMostPopularCategory(records), [records]);

  const signupsByWeek = useMemo(
    () => bucketByWeek(users.map(u => u._ts).filter((t): t is number => !!t), WEEKS_TO_SHOW, false),
    [users]
  );

  const sessionsByWeek = useMemo(
    () => bucketByWeek(sessions.map(s => s._ts).filter((t): t is number => !!t), WEEKS_TO_SHOW),
    [sessions]
  );

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <StatTile label="Total Sessions" value={String(sessions.length)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <StatTile label="Active Users" value={`${activeUserCount} / ${registeredUsers.length}`} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <StatTile label="Unregistered Accounts" value={String(unregisteredCount)} subtitle="Invited, never signed up" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <StatTile
          label="Most Popular Category"
          value={mostPopularCategory?.category ?? '—'}
          subtitle={mostPopularCategory ? `${mostPopularCategory.count} hands played` : undefined}
          valueSize="2rem"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <WeeklyBarChart title="Signups per Week" buckets={signupsByWeek} color="#e8877a" />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <WeeklyBarChart title="Sessions per Week" buckets={sessionsByWeek} color="#e8877a" />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <LeaderboardCard
          title="Most Sessions Created"
          entries={sessionCreatorEntries}
          usersMap={usersMap}
          countLabel={n => `${n} session${n === 1 ? '' : 's'}`}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <LeaderboardCard
          title="Most Connections"
          entries={connectionEntries}
          usersMap={usersMap}
          countLabel={n => `${n} player${n === 1 ? '' : 's'}`}
        />
      </Grid>
    </Grid>
  );
}
