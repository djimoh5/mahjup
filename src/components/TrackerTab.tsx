import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import type { MahjSession } from '../../model/mahj-session.model';
import type { GameRecord, PlayerHand } from '../../model/game.model';
import type { UserSummary } from '../../model/user.model';
import type { GameAnalysis } from '../../model/game-analysis.model';
import SessionGroup from './SessionGroup';
import { PlusIcon, RefreshIcon } from './icons/Icons';
import AiSummary from './AiSummary';

interface TrackerTabProps {
  sessions: MahjSession[];
  records: GameRecord[];
  newestSessionId: string | null;
  pendingSessionOids: Set<string>;
  users: UserSummary[];
  usersMap: Record<string, UserSummary>;
  currentUserOid: string;
  onAddSession: () => void;
  onSaveNewSession: (oid: string, patch: Partial<MahjSession>) => Promise<{ error?: string }>;
  onCancelNewSession: (oid: string) => void;
  onUpdateSession: (oid: string, patch: Partial<MahjSession>) => Promise<{ error?: string }>;
  onDeleteSession: (oid: string) => Promise<{ error?: string }>;
  onAddGame: (sessionId: string, sessionPlayers: string[], sessionDate: string) => Promise<{ error?: string }>;
  onUpdate: (id: string, patch: Partial<GameRecord>, skipSave?: boolean) => Promise<{ error?: string }>;
  onDelete: (id: string) => Promise<{ error?: string }>;
  onUserAdded: (newUser: UserSummary) => void;
  onSavePlayerHand: (gameOid: string, player: PlayerHand) => Promise<{ error?: string }>;
  analysis: GameAnalysis | null;
  lastModifiedAt: number;
  onAnalysisUpdated: (analysis: GameAnalysis) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function TrackerTab({
  sessions, records, newestSessionId, pendingSessionOids, users, usersMap, currentUserOid,
  analysis, lastModifiedAt, onAnalysisUpdated,
  onAddSession, onSaveNewSession, onCancelNewSession, onUpdateSession, onDeleteSession,
  onAddGame, onUpdate, onDelete, onUserAdded,
  onSavePlayerHand, onRefresh, isRefreshing,
}: TrackerTabProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    () => sessions[0]?.oid ?? null
  );

  useEffect(() => {
    if (newestSessionId) setExpandedSessionId(newestSessionId);
  }, [newestSessionId]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
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
        <Button
          size="small"
          onClick={onRefresh}
          disabled={isRefreshing}
          startIcon={
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
              }}
            >
              <RefreshIcon style={{ width: '1rem', height: '1rem' }} />
            </Box>
          }
          sx={{
            border: '1px solid rgba(242,171,164,0.55)',
            borderRadius: '0.5rem',
            background: '#fff',
            color: 'text.primary',
            '&:hover': { background: '#f9f9f9' },
          }}
        >
          Refresh
        </Button>
      </Box>

      <AiSummary analysis={analysis} lastModifiedAt={lastModifiedAt} records={records} sessions={sessions} onAnalysisUpdated={onAnalysisUpdated} />

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
              isPending={pendingSessionOids.has(session.oid)}
              isExpanded={expandedSessionId === session.oid}
              onToggle={() => setExpandedSessionId(id => id === session.oid ? null : session.oid)}
              onExpand={() => setExpandedSessionId(session.oid)}
              initialEditing={session.oid === newestSessionId}
              users={users}
              usersMap={usersMap}
              currentUserOid={currentUserOid}
              onAddGame={() => onAddGame(session.oid, session.players, sessionDate)}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onUpdateSession={patch => onUpdateSession(session.oid, patch)}
              onSaveNewSession={patch => onSaveNewSession(session.oid, patch)}
              onCancelNewSession={() => onCancelNewSession(session.oid)}
              onDeleteSession={() => onDeleteSession(session.oid)}
              onUserAdded={onUserAdded}
              onSavePlayerHand={onSavePlayerHand}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
            />
          );
        })}
      </Stack>
    </>
  );
}
