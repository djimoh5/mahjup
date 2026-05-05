import { useState, useEffect } from 'react';
import type { GameRecord } from '../model/game.model';
import type { MahjSession } from '../model/mahj-session.model';
import { authService, type AuthedUser } from './services/auth.service';
import { gameService } from './services/game.service';
import { mahjSessionService } from './services/mahj-session.service';
import Header from './components/Header';
import AuthScreen from './components/AuthScreen';
import TrackerTab from './components/TrackerTab';
import ReferenceTab from './components/ReferenceTab';
import SummaryTab from './components/SummaryTab';

export type Tab = 'tracker' | 'hands' | 'summary';

function makeSession(partial: Partial<MahjSession> = {}): MahjSession {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return {
    oid: crypto.randomUUID(),
    dateTime,
    players: [],
    ...partial,
  };
}

function makeRecord(partial: Partial<GameRecord> = {}): GameRecord {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return {
    oid: crypto.randomUUID(),
    sessionId: '',
    date,
    category: '',
    hand: '',
    wl: 'Loss',
    score: 0,
    participants: [],
    notes: '',
    ...partial,
  };
}

export default function App() {
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessions, setSessions] = useState<MahjSession[]>([]);
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
    Promise.all([
      mahjSessionService.getAll(),
      gameService.getAll(),
    ]).then(([{ sessions: fetchedSessions }, { records: fetchedRecords }]) => {
      setSessions(fetchedSessions);
      setRecords(fetchedRecords);
      setIsLoadingRecords(false);
    });
  }, [user]);

  function handleAuthenticated(u: AuthedUser) {
    setUser(u);
  }

  function handleLogout() {
    authService.logout();
    setUser(null);
    setSessions([]);
    setRecords([]);
  }

  async function addSession() {
    const newSession = makeSession();
    setSessions(prev => [newSession, ...prev]);
    await mahjSessionService.save(newSession);
  }

  async function updateSession(oid: string, patch: Partial<MahjSession>) {
    setSessions(prev => prev.map(s => (s.oid === oid ? { ...s, ...patch } : s)));
    const target = sessions.find(s => s.oid === oid);
    if (target) {
      await mahjSessionService.save({ ...target, ...patch });
    }
  }

  async function deleteSession(oid: string) {
    setSessions(prev => prev.filter(s => s.oid !== oid));
    setRecords(prev => prev.filter(r => r.sessionId !== oid));
    await mahjSessionService.remove(oid);
  }

  async function addRecord(sessionId: string, sessionPlayers: string[], sessionDate: string) {
    const newRecord = makeRecord({ sessionId, participants: sessionPlayers, date: sessionDate });
    setRecords(prev => [newRecord, ...prev]);
    await gameService.save(newRecord);
  }

  async function updateRecord(oid: string, patch: Partial<GameRecord>, skipSave?: boolean) {
    setRecords(prev => prev.map(r => (r.oid === oid ? { ...r, ...patch } : r)));

    if (!skipSave) {
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

  const sortedSessions = [...sessions].sort((a, b) => b.dateTime.localeCompare(a.dateTime));

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
            sessions={sortedSessions}
            records={records}
            onAddSession={addSession}
            onUpdateSession={updateSession}
            onDeleteSession={deleteSession}
            onAddGame={addRecord}
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
