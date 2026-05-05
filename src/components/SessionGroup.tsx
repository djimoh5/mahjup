import { useState } from 'react';
import type { MahjSession } from '../../model/mahj-session.model';
import type { GameRecord } from '../../model/game.model';
import GameRow from './GameRow';
import GameCardMobile from './GameCardMobile';
import { useIsMobile } from '../hooks/useIsMobile';

interface SessionGroupProps {
  session: MahjSession;
  games: GameRecord[];
  onAddGame: () => void;
  onUpdate: (id: string, patch: Partial<GameRecord>, skipSave?: boolean) => void;
  onDelete: (id: string) => void;
  onUpdateSession: (patch: Partial<MahjSession>) => void;
  onDeleteSession: () => void;
}

function formatDateTime(dt: string): string {
  if (!dt) return '—';
  const [datePart, timePart] = dt.split('T');
  const [y, m, d] = datePart.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  const dayName = days[date.getDay()];
  const monthName = months[parseInt(m) - 1];
  const dayNum = parseInt(d);

  if (!timePart) return `${dayName}, ${monthName} ${dayNum}`;

  const [h, min] = timePart.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${dayName}, ${monthName} ${dayNum} · ${hour12}:${min}${ampm}`;
}

export default function SessionGroup({
  session, games, onAddGame, onUpdate, onDelete, onUpdateSession, onDeleteSession
}: SessionGroupProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(session.players.length === 0);

  const [editTitle, setEditTitle] = useState(session.title ?? '');
  const [editDateTime, setEditDateTime] = useState(session.dateTime);
  const [editPlayers, setEditPlayers] = useState<string[]>(
    session.players.length > 0 ? [...session.players] : ['']
  );
  const [newPlayer, setNewPlayer] = useState('');

  function handleOpenEdit() {
    setEditTitle(session.title ?? '');
    setEditDateTime(session.dateTime);
    setEditPlayers(session.players.length > 0 ? [...session.players] : ['']);
    setNewPlayer('');
    setIsEditing(true);
  }

  function handleSave() {
    const allPlayers = [...editPlayers];
    if (newPlayer.trim()) allPlayers.push(newPlayer.trim());
    const cleanedPlayers = allPlayers.filter(p => p.trim() !== '');
    onUpdateSession({
      title: editTitle.trim() || undefined,
      dateTime: editDateTime,
      players: cleanedPlayers,
    });
    setEditPlayers(cleanedPlayers.length > 0 ? cleanedPlayers : ['']);
    setNewPlayer('');
    setIsEditing(false);
  }

  function handleCancel() {
    setEditTitle(session.title ?? '');
    setEditDateTime(session.dateTime);
    setEditPlayers(session.players.length > 0 ? [...session.players] : ['']);
    setNewPlayer('');
    setIsEditing(false);
  }

  function handleEditPlayerChange(idx: number, value: string) {
    setEditPlayers(prev => prev.map((p, i) => (i === idx ? value : p)));
  }

  function handleRemovePlayer(idx: number) {
    setEditPlayers(prev => prev.filter((_, i) => i !== idx));
  }

  function handleAddPlayer() {
    if (newPlayer.trim()) {
      setEditPlayers(prev => [...prev, newPlayer.trim()]);
      setNewPlayer('');
    }
  }

  function handleNewPlayerKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPlayer();
    }
  }

  return (
    <div className="session-group">
      <div className="session-header">
        <button
          className="session-collapse-btn"
          onClick={() => setIsExpanded(prev => !prev)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className={`session-chevron${isExpanded ? '' : ' session-chevron--collapsed'}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="session-header-info">
          <span className="session-datetime">{formatDateTime(session.dateTime)}</span>
          {session.title && <span className="session-title">{session.title}</span>}
          <div className="session-player-pills">
            {session.players.map(p => (
              <span key={p} className="session-player-pill">{p}</span>
            ))}
          </div>
        </div>

        <div className="session-header-actions">
          {!isEditing && (
            <>
              <button className="btn-primary session-add-game-btn" onClick={onAddGame}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Game
              </button>
              <button className="session-edit-btn" onClick={handleOpenEdit} aria-label="Edit session">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button className="session-delete-btn" onClick={onDeleteSession} aria-label="Delete session">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="session-edit-form">
          <div className="session-edit-field">
            <label className="session-edit-label">Title (optional)</label>
            <input
              type="text"
              value={editTitle}
              className="row-input"
              placeholder="e.g. Tuesday Morning Mahj"
              onChange={e => setEditTitle(e.target.value)}
            />
          </div>

          <div className="session-edit-field">
            <label className="session-edit-label">Date &amp; Time</label>
            <input
              type="datetime-local"
              value={editDateTime}
              className="row-input"
              onChange={e => setEditDateTime(e.target.value)}
            />
          </div>

          <div className="session-edit-field">
            <label className="session-edit-label">Players</label>
            <div className="player-entry-list">
              {editPlayers.map((p, idx) => (
                <div key={idx} className="player-entry-row">
                  <input
                    type="text"
                    value={p}
                    className="row-input"
                    placeholder={`Player ${idx + 1}`}
                    onChange={e => handleEditPlayerChange(idx, e.target.value)}
                  />
                  <button
                    className="player-remove-btn"
                    onClick={() => handleRemovePlayer(idx)}
                    aria-label="Remove player"
                    type="button"
                  >×</button>
                </div>
              ))}
              <div className="player-entry-row player-entry-row--add">
                <input
                  type="text"
                  value={newPlayer}
                  className="row-input"
                  placeholder="Add a player..."
                  onChange={e => setNewPlayer(e.target.value)}
                  onKeyDown={handleNewPlayerKeyDown}
                />
                <button
                  className="player-add-btn"
                  onClick={handleAddPlayer}
                  type="button"
                >+</button>
              </div>
            </div>
          </div>

          <div className="session-edit-footer">
            <button className="btn-primary" onClick={handleSave}>Save Session</button>
            <button className="session-cancel-btn" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      )}

      {isExpanded && !isEditing && (
        <div className="session-games">
          {games.length === 0 ? (
            <div className="session-empty">No games yet — click "Add Game" to record the first one.</div>
          ) : isMobile ? (
            <div className="card-list-mobile">
              {games.map(game => (
                <GameCardMobile
                  key={game.oid}
                  record={game}
                  sessionPlayers={session.players}
                  onUpdate={(patch, skipSave) => onUpdate(game.oid, patch, skipSave)}
                  onDelete={() => onDelete(game.oid)}
                />
              ))}
            </div>
          ) : (
            <div className="table-wrapper session-table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th className="col-date">Date</th>
                    <th className="col-cat">Category</th>
                    <th>Exact Hand</th>
                    <th className="center col-result">Result</th>
                    <th className="center col-pts">Points</th>
                    <th className="col-opp">Players</th>
                    <th className="col-del"></th>
                  </tr>
                </thead>
                <tbody>
                  {games.map(game => (
                    <GameRow
                      key={game.oid}
                      record={game}
                      sessionPlayers={session.players}
                      onUpdate={(patch, skipSave) => onUpdate(game.oid, patch, skipSave)}
                      onDelete={() => onDelete(game.oid)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
