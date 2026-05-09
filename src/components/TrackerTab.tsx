import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import type { MahjSession } from '../../model/mahj-session.model';
import type { GameRecord } from '../../model/game.model';
import type { UserSummary } from '../../model/user.model';
import SessionGroup from './SessionGroup';
import { PlusIcon } from './icons/Icons';

interface TrackerTabProps {
  sessions: MahjSession[];
  records: GameRecord[];
  newestSessionId: string | null;
  users: UserSummary[];
  usersMap: Record<string, UserSummary>;
  currentUserOid: string;
  onAddSession: () => void;
  onUpdateSession: (oid: string, patch: Partial<MahjSession>) => void;
  onDeleteSession: (oid: string) => void;
  onAddGame: (sessionId: string, sessionPlayers: string[], sessionDate: string) => void;
  onUpdate: (id: string, patch: Partial<GameRecord>, skipSave?: boolean) => void;
  onDelete: (id: string) => void;
  onUserAdded: (newUser: UserSummary) => void;
}

export default function TrackerTab({
  sessions, records, newestSessionId, users, usersMap, currentUserOid,
  onAddSession, onUpdateSession, onDeleteSession,
  onAddGame, onUpdate, onDelete, onUserAdded,
}: TrackerTabProps) {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-end', sm: 'center' },
          justifyContent: 'space-between',
          mb: 3,
          gap: 2,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={onAddSession}
          startIcon={<PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />}
        >
          New Session
        </Button>
      </Box>

      <Stack spacing={2}>
        {sessions.length === 0 && (
          <Box
            sx={{
              p: '2.5rem 1.5rem',
              textAlign: 'center',
              color: 'text.secondary',
              fontSize: '0.9375rem',
              background: 'rgba(255,255,255,0.88)',
              borderRadius: '1rem',
              border: '1px dashed rgba(242,171,164,0.55)',
              backdropFilter: 'blur(8px)',
            }}
          >
            No sessions yet — click "New Session" to schedule your first Mahj gathering.
          </Box>
        )}
        {sessions.map(session => {
          const sessionGames = records.filter(r => r.sessionId === session.oid);
          const sessionDate = session.dateTime.split('T')[0];
          return (
            <SessionGroup
              key={session.oid}
              session={session}
              games={sessionGames}
              initialEditing={session.oid === newestSessionId}
              users={users}
              usersMap={usersMap}
              currentUserOid={currentUserOid}
              onAddGame={() => onAddGame(session.oid, session.players, sessionDate)}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onUpdateSession={patch => onUpdateSession(session.oid, patch)}
              onDeleteSession={() => onDeleteSession(session.oid)}
              onUserAdded={onUserAdded}
            />
          );
        })}
      </Stack>
    </>
  );
}
