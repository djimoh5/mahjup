import { useState } from 'react';
import { handData } from '../data/hands';
import type { GameRecord } from '../../model/game.model';

interface GameCardMobileProps {
  record: GameRecord;
  sessionPlayers: string[];
  onUpdate: (patch: Partial<GameRecord>, skipSave?: boolean) => void;
  onDelete: () => void;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

export default function GameCardMobile({ record, sessionPlayers, onUpdate, onDelete }: GameCardMobileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const categoryHands = handData[record.category] ?? [];

  function handleCategoryChange(cat: string) {
    onUpdate({ category: cat, hand: '', score: 0 });
  }

  function handleHandChange(hand: string) {
    const match = handData[record.category]?.find(item => item.h === hand);
    onUpdate({ hand, score: match ? match.v : 0 });
  }

  function handleParticipantToggle(player: string, checked: boolean) {
    const current = record.participants.length > 0 ? record.participants : sessionPlayers;
    const updated = checked
      ? [...current, player]
      : current.filter(p => p !== player);
    onUpdate({ participants: updated });
  }

  const participants = record.participants.length > 0 ? record.participants : sessionPlayers;

  return (
    <div className={`mc-card${isEditing ? ' mc-card--editing' : ''}`}>
      {/* Summary row — always visible */}
      <div className="mc-summary">
        <span className="mc-summary-date">{formatDate(record.date)}</span>
        <span className="mc-summary-hand">
          {record.category && <span className="mc-summary-cat">{record.category} · </span>}
          {record.hand || <em className="mc-summary-empty">No hand</em>}
        </span>
        {record.score > 0 && (
          <div className="row-score-badge mc-summary-score">{record.score}</div>
        )}
        <span className={`mc-wl-badge mc-wl-badge--${record.wl === 'Win' ? 'win' : 'loss'}`}>
          {record.wl === 'Win' ? 'WIN' : 'LOSS'}
        </span>
        {!isEditing && (
          <button className="mc-pencil-btn" onClick={() => setIsEditing(true)} aria-label="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
      </div>

      {/* Edit body — visible only when editing */}
      {isEditing && (
        <div className="mc-edit-body">
          <div className="mc-field">
            <label className="mc-label">Date</label>
            <input
              type="date"
              value={record.date}
              className="row-input"
              onChange={e => onUpdate({ date: e.target.value })}
            />
          </div>

          <div className="mc-field">
            <label className="mc-label">Category</label>
            <select
              value={record.category}
              className="row-input"
              onChange={e => handleCategoryChange(e.target.value)}
            >
              <option value="">Select...</option>
              {Object.keys(handData).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="mc-field">
            <label className="mc-label">Exact Hand</label>
            <select
              value={record.hand}
              className="row-input"
              disabled={!record.category}
              onChange={e => handleHandChange(e.target.value)}
            >
              <option value="">Choose Hand</option>
              {categoryHands.map(item => (
                <option key={item.h} value={item.h}>{item.h}</option>
              ))}
            </select>
          </div>

          <div className="mc-field">
            <label className="mc-label">Result</label>
            <select
              value={record.wl}
              className="row-input"
              onChange={e => onUpdate({ wl: e.target.value as 'Win' | 'Loss' })}
            >
              <option value="Win">WIN</option>
              <option value="Loss">LOSS</option>
            </select>
          </div>

          <div className="mc-field">
            <label className="mc-label">Points</label>
            <div className="row-score-badge">{record.score}</div>
          </div>

          <div className="mc-field">
            <label className="mc-label">Players</label>
            <div className="participant-checks">
              {sessionPlayers.map(player => (
                <label key={player} className="participant-check-label">
                  <input
                    type="checkbox"
                    checked={participants.includes(player)}
                    onChange={e => handleParticipantToggle(player, e.target.checked)}
                  />
                  {player}
                </label>
              ))}
            </div>
          </div>

          <div className="mc-field">
            <label className="mc-label">Notes</label>
            <textarea
              className="row-notes"
              rows={3}
              placeholder="Notes..."
              value={record.notes}
              onChange={e => onUpdate({ notes: e.target.value }, true)}
              onBlur={() => onUpdate({})}
            />
          </div>

          <div className="mc-edit-footer">
            <button onClick={onDelete} className="delete-btn">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
            <button className="mc-done-btn" onClick={() => setIsEditing(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
