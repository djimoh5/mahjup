import { useState, useEffect } from 'react';
import type { GameRecord } from '../model/game.model';
import { authService, type AuthedUser } from './services/auth.service';
import { gameService } from './services/game.service';
import Header from './components/Header';
import AuthScreen from './components/AuthScreen';
import TrackerTab from './components/TrackerTab';
import ReferenceTab from './components/ReferenceTab';
import SummaryTab from './components/SummaryTab';

export type Tab = 'tracker' | 'hands' | 'summary';

function makeRecord(partial: Partial<GameRecord> = {}): GameRecord {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return {
    oid: crypto.randomUUID(),
    date,
    category: '',
    hand: '',
    wl: 'Loss',
    score: 0,
    opponents: '',
    notes: '',
    ...partial,
  };
}

export default function App() {
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('tracker');

  useEffect(() => {
    authService.checkAuth().then(u => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    setIsLoadingRecords(true);
    gameService.getAll().then(({ records: fetched }) => {
      setRecords(fetched);
      setIsLoadingRecords(false);
    });
  }, [user]);

  function handleAuthenticated(u: AuthedUser) {
    setUser(u);
  }

  function handleLogout() {
    authService.logout();
    setUser(null);
    setRecords([]);
  }

  async function addRecord() {
    const newRecord = makeRecord();
    setRecords(prev => [newRecord, ...prev]);
    await gameService.save(newRecord);
  }

  async function updateRecord(oid: string, patch: Partial<GameRecord>, skipSave?: boolean) {
    setRecords(prev => prev.map(r => (r.oid === oid ? { ...r, ...patch } : r)));

    if(!skipSave) {
      const target = records.find(r => r.oid === oid);
      if (target) {
        await gameService.save({ ...target, ...patch });
      }
    }
  }

  async function deleteRecord(oid: string) {
    setRecords(prev => prev.filter(r => r.oid !== oid));
    await gameService.remove(oid);
  }

  if (authLoading || isLoadingRecords) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSaving={false}
        username={user.username}
        onLogout={handleLogout}
      />
      <main className="app-main">
        <div className={`view-content${activeTab !== 'tracker' ? ' hidden' : ''}`}>
          <TrackerTab
            records={sortedRecords}
            onAdd={addRecord}
            onUpdate={updateRecord}
            onDelete={deleteRecord}
          />
        </div>
        <div className={`view-content${activeTab !== 'hands' ? ' hidden' : ''}`}>
          <ReferenceTab />
        </div>
        <div className={`view-content${activeTab !== 'summary' ? ' hidden' : ''}`}>
          <SummaryTab records={records} />
        </div>
      </main>
      <footer className="app-footer">
        Designed for 2026 NMJL Official Rules &bull; Always Play Responsibly
      </footer>
    </div>
  );
}
