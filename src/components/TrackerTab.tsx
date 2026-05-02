import type { GameRecord } from '../../model/game.model';
import GameRow from './GameRow';

interface TrackerTabProps {
  records: GameRecord[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<GameRecord>) => void;
  onDelete: (id: string) => void;
}

export default function TrackerTab({ records, onAdd, onUpdate, onDelete }: TrackerTabProps) {
  return (
    <>
      <div className="tracker-toolbar">
        <button onClick={onAdd} className="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Game Entry
        </button>
        <div className="autosave-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Autosave Active
        </div>
      </div>

      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th className="col-date">Date</th>
              <th className="col-cat">Category</th>
              <th>Exact Hand</th>
              <th className="center col-result">Result</th>
              <th className="center col-pts">Points</th>
              <th className="col-opp">Opponents</th>
              <th className="col-del"></th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <GameRow
                key={record.oid}
                record={record}
                onUpdate={patch => onUpdate(record.oid, patch)}
                onDelete={() => onDelete(record.oid)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
