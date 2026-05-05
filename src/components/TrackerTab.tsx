import type { MahjSession } from '../../model/mahj-session.model';
import type { GameRecord } from '../../model/game.model';
import SessionGroup from './SessionGroup';

interface TrackerTabProps {
  sessions: MahjSession[];
  records: GameRecord[];
  onAddSession: () => void;
  onUpdateSession: (oid: string, patch: Partial<MahjSession>) => void;
  onDeleteSession: (oid: string) => void;
  onAddGame: (sessionId: string, sessionPlayers: string[], sessionDate: string) => void;
  onUpdate: (id: string, patch: Partial<GameRecord>, skipSave?: boolean) => void;
  onDelete: (id: string) => void;
}

export default function TrackerTab({
  sessions, records, onAddSession, onUpdateSession, onDeleteSession,
  onAddGame, onUpdate, onDelete,
}: TrackerTabProps) {
  return (
    <>
      <div className="tracker-toolbar">
        <button onClick={onAddSession} className="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Session
        </button>
        <div className="autosave-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Autosave Active
        </div>
      </div>

      <div className="sessions-list">
        {sessions.length === 0 && (
          <div className="sessions-empty">
            No sessions yet — click "New Session" to schedule your first Mahj gathering.
          </div>
        )}
        {sessions.map(session => {
          const sessionGames = records.filter(r => r.sessionId === session.oid);
          const sessionDate = session.dateTime.split('T')[0];
          return (
            <SessionGroup
              key={session.oid}
              session={session}
              games={sessionGames}
              onAddGame={() => onAddGame(session.oid, session.players, sessionDate)}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onUpdateSession={patch => onUpdateSession(session.oid, patch)}
              onDeleteSession={() => onDeleteSession(session.oid)}
            />
          );
        })}
      </div>
    </>
  );
}
