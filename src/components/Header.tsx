import type { Tab } from '../App';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isSaving: boolean;
  username: string;
  onLogout: () => void;
}

export default function Header({ activeTab, onTabChange, isSaving, username, onLogout }: HeaderProps) {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="header-brand">
          <div className="header-icon">🀄</div>
          <div>
            <h1 className="header-title">Mahjong Tracker</h1>
            <p className="header-date">{dateStr}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="autosave-status" style={{ display: isSaving ? 'flex' : 'none' }}>
            <div className="ping-wrapper">
              <span className="ping-ring"></span>
              <span className="ping-core"></span>
            </div>
            Syncing
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(250, 208, 200, 0.9)' }}>
            {username}
          </span>
          <button className="logout-btn" onClick={onLogout}>Sign Out</button>
        </div>
      </div>

      <nav className="app-nav">
        <button
          onClick={() => onTabChange('tracker')}
          className={`tab-btn${activeTab === 'tracker' ? ' tab-active' : ''}`}
        >
          My Tracker
        </button>
        <button
          onClick={() => onTabChange('hands')}
          className={`tab-btn${activeTab === 'hands' ? ' tab-active' : ''}`}
        >
          2026 NMJL Reference
        </button>
        <button
          onClick={() => onTabChange('summary')}
          className={`tab-btn${activeTab === 'summary' ? ' tab-active' : ''}`}
        >
          Summary Insights
        </button>
      </nav>
    </header>
  );
}
