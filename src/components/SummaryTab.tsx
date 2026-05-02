import type { GameRecord } from '../../model/game.model';

interface SummaryTabProps {
  records: GameRecord[];
}

export default function SummaryTab({ records }: SummaryTabProps) {
  const valid = records.filter(d => d.category);
  const wins = valid.filter(d => d.wl === 'Win');
  const total = valid.length;
  const points = wins.reduce((acc, d) => acc + d.score, 0);
  const winRate = total > 0 ? `${Math.round((wins.length / total) * 100)}%` : '0%';

  const counts: Record<string, number> = {};
  valid.forEach(d => {
    counts[d.category] = (counts[d.category] ?? 0) + 1;
  });

  return (
    <>
      <div className="summary-grid">
        <div className="stat-card">
          <div className="stat-icon-bg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="stat-label muted">Total Games</div>
          <div className="stat-value">{total}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-bg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-label rose">Win Rate</div>
          <div className="stat-value">{winRate}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-bg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-label purple">Total Points Earned</div>
          <div className="stat-value">{points}</div>
        </div>
      </div>

      <div className="distribution-section">
        <h3>
          <span className="distribution-accent"></span>
          Category Distribution
        </h3>
        <div className="category-stats">
          {Object.entries(counts).map(([cat, count]) => (
            <div key={cat}>
              <div className="category-stat-label">
                <span>{cat}</span>
                <span>{count} games</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(count / total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
