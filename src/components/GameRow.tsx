import { handData } from '../data/hands';
import type { GameRecord } from '../../model/game.model';

interface GameRowProps {
  record: GameRecord;
  sessionPlayers: string[];
  onUpdate: (patch: Partial<GameRecord>, skipSave?: boolean) => void;
  onDelete: () => void;
}

export default function GameRow({ record, sessionPlayers, onUpdate, onDelete }: GameRowProps) {
  const categoryHands = handData[record.category] ?? [];

  function handleCategoryChange(cat: string) {
    onUpdate({ category: cat, hand: '', score: 0 });
  }

  function handleHandChange(hand: string) {
    const match = handData[record.category]?.find(item => item.h === hand);
    onUpdate({ hand, score: match ? match.v : 0 });
  }

  function handleParticipantToggle(player: string, checked: boolean) {
    const updated = checked
      ? [...record.participants, player]
      : record.participants.filter(p => p !== player);
    onUpdate({ participants: updated });
  }

  const participants = record.participants;

  return (
    <>
      <tr className="data-row">
        <td>
          <input
            type="date"
            value={record.date}
            className="row-date row-input"
            onChange={e => onUpdate({ date: e.target.value })}
          />
        </td>
        <td>
          <select
            value={record.category}
            className="row-category row-input"
            onChange={e => handleCategoryChange(e.target.value)}
          >
            <option value="">Select...</option>
            {Object.keys(handData).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </td>
        <td>
          <select
            value={record.hand}
            className="row-hand row-input"
            onChange={e => handleHandChange(e.target.value)}
          >
            <option value="">Choose Hand</option>
            {categoryHands.map(item => (
              <option key={item.h} value={item.h}>{item.h}</option>
            ))}
          </select>
        </td>
        <td className="center">
          <select
            value={record.wl}
            className="row-wl row-input"
            onChange={e => onUpdate({ wl: e.target.value as 'Win' | 'Loss' })}
          >
            <option value="Win">WIN</option>
            <option value="Loss">LOSS</option>
          </select>
        </td>
        <td>
          <div className="row-score-badge">{record.score}</div>
        </td>
        <td>
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
        </td>
        <td className="center">
          <button onClick={onDelete} className="delete-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </td>
      </tr>
      <tr className="notes-row">
        <td colSpan={7}>
          <textarea
            className="row-notes"
            rows={2}
            placeholder="Notes..."
            value={record.notes}
            onChange={e => onUpdate({ notes: e.target.value }, true)}
            onBlur={() => onUpdate({})}
          />
        </td>
      </tr>
    </>
  );
}
