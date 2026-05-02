import { handData } from '../data/hands';

export default function ReferenceTab() {
  return (
    <div className="reference-grid">
      {Object.entries(handData).map(([category, hands]) => (
        <div key={category} className="hand-card">
          <div className="hand-card-header">
            <span>{category}</span>
            <span className="hand-count-badge">{hands.length} Hands</span>
          </div>
          <div className="hand-card-body">
            {hands.map(h => (
              <div key={h.h} className="hand-entry">
                <span className="hand-text">{h.h}</span>
                <span className="hand-value">{h.v}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
