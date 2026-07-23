import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { SearchIcon } from './icons/Icons';
import type { UserSummary } from '../../model/user.model';
import type { MahjSession } from '../../model/mahj-session.model';
import type { GameRecord } from '../../model/game.model';
import type { GameAnalysis } from '../../model/game-analysis.model';
import AdminUserAccordion from './AdminUserAccordion';
import { resolveDisplayName } from '../utils/user';

interface AdminDataTabProps {
  users: UserSummary[];
  sessions: MahjSession[];
  records: GameRecord[];
  analyses: GameAnalysis[];
}

export default function AdminDataTab({ users, sessions, records, analyses }: AdminDataTabProps) {
  const usersMap = useMemo(() => Object.fromEntries(users.map(u => [u.oid, u])), [users]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const sortedUsers = [...users].sort((a, b) =>
    resolveDisplayName(a.oid, usersMap).localeCompare(resolveDisplayName(b.oid, usersMap))
  );

  const query = search.trim().toLowerCase();
  const filteredUsers = query
    ? sortedUsers.filter(u =>
        resolveDisplayName(u.oid, usersMap).toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query)
      )
    : sortedUsers;

  if (users.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
        No users found.
      </Box>
    );
  }

  return (
    <Box>
      <TextField
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search users by name or email…"
        fullWidth
        size="small"
        sx={{
          mb: 2,
          background: '#fff',
          borderRadius: '0.75rem',
          '& .MuiOutlinedInput-root': { borderRadius: '0.75rem' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(242,171,164,0.55)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(242,171,164,0.85)' },
          '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon style={{ width: '1rem', height: '1rem', color: 'rgba(0,0,0,0.4)' }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1.5 }}>
        {filteredUsers.length} of {users.length} user{users.length === 1 ? '' : 's'}
      </Typography>
      {filteredUsers.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          No users match "{search}".
        </Box>
      ) : (
      <Stack spacing={1.5}>
        {filteredUsers.map(user => (
          <AdminUserAccordion
            key={user.oid}
            user={user}
            isExpanded={expandedUserId === user.oid}
            onToggle={() => setExpandedUserId(id => id === user.oid ? null : user.oid)}
            sessions={sessions}
            records={records}
            analyses={analyses}
            usersMap={usersMap}
          />
        ))}
      </Stack>
      )}
    </Box>
  );
}
