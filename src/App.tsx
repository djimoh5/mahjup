import { useState, useEffect, useMemo } from 'react';
import bgUrl from '../Assets/mahjong-table-backround.png';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import type { GameRecord, PlayerHand } from '../model/game.model';
import type { MahjSession } from '../model/mahj-session.model';
import type { GameAnalysis } from '../model/game-analysis.model';
import type { UserSummary } from '../model/user.model';
import { UniqueId } from '../model/id.model';
import { authService, type AuthedUser } from './services/auth.service';
import { gameService } from './services/game.service';
import { mahjSessionService } from './services/mahj-session.service';
import { userService } from './services/user.service';
import Header from './components/Header';
import AuthScreen from './components/AuthScreen';
import LandingPage from './components/LandingPage';
import InviteRedeemScreen from './components/InviteRedeemScreen';
import TrackerTab from './components/TrackerTab';
import ReferenceTab from './components/ReferenceTab';
import SummaryTab from './components/SummaryTab';
import AiSummaryTab from './components/AiSummaryTab';

export type Tab = 'tracker' | 'hands' | 'summary' | 'aiSummary';

const TAB_PATHS: Record<Tab, string> = {
  tracker: '/tracker',
  hands: '/reference',
  summary: '/summary',
  aiSummary: '/ai-summary',
};

const PATH_TO_TAB: Record<string, Tab> = {
  '/tracker': 'tracker',
  '/reference': 'hands',
  '/summary': 'summary',
  '/ai-summary': 'aiSummary',
};

function makeSession(partial: Partial<MahjSession> = {}): MahjSession {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return {
    oid: UniqueId(crypto.randomUUID()),
    dateTime,
    players: [],
    ...partial,
  };
}

function makeRecord(partial: Partial<GameRecord> = {}): GameRecord {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return {
    oid: UniqueId(crypto.randomUUID()),
    sessionId: '',
    date,
    players: [],
    ...partial,
  };
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [inviteCode, setInviteCode] = useState<string | null>(() => {
    if (window.location.pathname === '/invite') {
      return new URLSearchParams(window.location.search).get('code');
    }
    return null;
  });

  const [user, setUser] = useState<AuthedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessions, setSessions] = useState<MahjSession[]>([]);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [analyses, setAnalyses] = useState<GameAnalysis[]>([]);
  const [lastModifiedAt, setLastModifiedAt] = useState(0);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [newestSessionId, setNewestSessionId] = useState<string | null>(null);
  const [pendingSessionOids, setPendingSessionOids] = useState<Set<string>>(new Set());

  const activeTab: Tab = PATH_TO_TAB[location.pathname] ?? 'tracker';

  useEffect(() => {
    authService.checkAuth().then(u => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    setIsLoadingRecords(true);
    Promise.all([
      mahjSessionService.getAll(),
      gameService.getAll(),
      userService.getAffiliated().catch(() => ({ users: [] as UserSummary[] })),
      gameService.getAnalyses().catch(() => ({ analyses: [] as GameAnalysis[] })),
    ]).then(([{ sessions: fetchedSessions }, { records: fetchedRecords }, { users: fetchedUsers }, { analyses: fetchedAnalyses }]) => {
      setSessions(fetchedSessions);
      setRecords(fetchedRecords.map(r => ({ ...r, players: r.players ?? [] })));
      setUsers(fetchedUsers);
      setAnalyses(fetchedAnalyses);
    }).catch(() => {}).finally(() => {
      setIsLoadingRecords(false);
    });
  }, [user]);

  async function refreshData() {
    if (!user || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const [{ sessions: fetchedSessions }, { records: fetchedRecords }, { users: fetchedUsers }, { analyses: fetchedAnalyses }] = await Promise.all([
        mahjSessionService.getAll(),
        gameService.getAll(),
        userService.getAffiliated().catch(() => ({ users: [] as UserSummary[] })),
        gameService.getAnalyses().catch(() => ({ analyses: [] as GameAnalysis[] })),
      ]);
      setSessions(fetchedSessions);
      setRecords(fetchedRecords.map(r => ({ ...r, players: r.players ?? [] })));
      setUsers(fetchedUsers);
      setAnalyses(fetchedAnalyses);
    } catch {
      // silently ignore
    } finally {
      setIsRefreshing(false);
    }
  }

  const usersMap = useMemo(
    () => Object.fromEntries(users.map(u => [u.oid, u])),
    [users]
  );


  function handleAuthenticated(u: AuthedUser) {
    setUser(u);
    if (!PATH_TO_TAB[location.pathname]) {
      navigate('/tracker', { replace: true });
    }
  }

  function handleUserUpdate(updated: AuthedUser) {
    setUser(updated);
  }

  function handleLogout() {
    authService.logout();
    setUser(null);
    setSessions([]);
    setRecords([]);
    setUsers([]);
    navigate('/', { replace: true });
  }

  function handleAnalysisUpdated(updated: GameAnalysis) {
    setAnalyses(prev => {
      const idx = prev.findIndex(a => a.oid === updated.oid);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
  }

  async function deleteAnalysis(oid: string): Promise<{ error?: string }> {
    const { error } = await gameService.deleteAnalysis(oid);
    if (error) return { error };
    setAnalyses(prev => prev.filter(a => a.oid !== oid));
    return {};
  }

  function handleUserAdded(newUser: UserSummary) {
    setUsers(prev => [...prev, newUser]);
  }

  function addSession() {
    const newSession = makeSession({ userId: user?.oid });
    setSessions(prev => [newSession, ...prev]);
    setPendingSessionOids(prev => new Set([...prev, newSession.oid]));
    setNewestSessionId(newSession.oid);
  }

  async function saveNewSession(oid: string, patch: Partial<MahjSession>): Promise<{ error?: string }> {
    const target = sessions.find(s => s.oid === oid);
    if (!target) return { error: 'Session not found' };

    const sessionToSave = { ...target, ...patch };
    const { error: sessionError } = await mahjSessionService.save(sessionToSave);
    if (sessionError) return { error: sessionError };

    const firstGame = makeRecord({
      userId: user?.oid,
      sessionId: oid,
      date: sessionToSave.dateTime.split('T')[0],
      players: user ? [{ userId: user.oid, category: '', hand: '', jokers: 0, isWinner: false, score: 0 }] : [],
    });
    const { error: gameError } = await gameService.save(firstGame);

    setSessions(prev => prev.map(s => s.oid === oid ? sessionToSave : s));
    setPendingSessionOids(prev => { const next = new Set(prev); next.delete(oid); return next; });
    setRecords(prev => [firstGame, ...prev]);
    setLastModifiedAt(Date.now());

    if (gameError) {
      return { error: `Session saved, but the first game could not be created: ${gameError}` };
    }
    return {};
  }

  function cancelNewSession(oid: string) {
    setSessions(prev => prev.filter(s => s.oid !== oid));
    setRecords(prev => prev.filter(r => r.sessionId !== oid));
    setPendingSessionOids(prev => { const next = new Set(prev); next.delete(oid); return next; });
    if (newestSessionId === oid) setNewestSessionId(null);
  }

  async function updateSession(oid: string, patch: Partial<MahjSession>): Promise<{ error?: string }> {
    const target = sessions.find(s => s.oid === oid);
    if (!target) return { error: 'Session not found' };
    const updated = { ...target, ...patch };
    const { error } = await mahjSessionService.save(updated);
    if (error) return { error };
    setSessions(prev => prev.map(s => s.oid === oid ? updated : s));
    setLastModifiedAt(Date.now());
    return {};
  }

  async function deleteSession(oid: string): Promise<{ error?: string }> {
    const { error } = await mahjSessionService.remove(oid);
    if (error) return { error };
    setSessions(prev => prev.filter(s => s.oid !== oid));
    setRecords(prev => prev.filter(r => r.sessionId !== oid));
    setLastModifiedAt(Date.now());
    return {};
  }

  async function addRecord(sessionId: string, _sessionPlayers: string[], sessionDate: string): Promise<{ error?: string }> {
    const prevGame = records.filter(r => r.sessionId === sessionId).find(r => r.players.length > 0);
    const blankPlayer = (userId: string): PlayerHand => ({ userId, category: '', hand: '', jokers: 0, isWinner: false, score: 0 });
    const copiedPlayers: PlayerHand[] = prevGame
      ? prevGame.players.filter(p => p.userId).map(p => blankPlayer(p.userId))
      : user ? [blankPlayer(user.oid)] : [];
    const newRecord = makeRecord({ userId: user?.oid, sessionId, date: sessionDate, players: copiedPlayers });
    const { error } = await gameService.save(newRecord);
    if (error) return { error };
    setRecords(prev => [newRecord, ...prev]);
    setLastModifiedAt(Date.now());
    return {};
  }

  async function updateRecord(oid: string, patch: Partial<GameRecord>, skipSave?: boolean): Promise<{ error?: string }> {
    if (skipSave) {
      setRecords(prev => prev.map(r => (r.oid === oid ? { ...r, ...patch } : r)));
      return {};
    }

    const localRecord = records.find(r => r.oid === oid);
    const { record: fresh } = await gameService.getRecord(oid);
    const base = fresh ?? localRecord;
    if (!base) return { error: 'Record not found' };

    const { players: patchPlayers, ...nonPlayerPatch } = patch;
    const merged: GameRecord = { ...base, ...nonPlayerPatch };

    if (patchPlayers) {
      if (fresh?.players) {
        const freshByUserId = Object.fromEntries(
          fresh.players.filter(p => p.userId).map(p => [p.userId, p])
        );
        const localByUserId = Object.fromEntries(
          (localRecord?.players ?? []).filter(p => p.userId).map(p => [p.userId, p])
        );
        merged.players = patchPlayers.map(patchPlayer => {
          const freshPlayer = freshByUserId[patchPlayer.userId];
          const localPlayer = localByUserId[patchPlayer.userId];
          if (!freshPlayer || !localPlayer) return patchPlayer;
          const diff: Partial<PlayerHand> = {};
          for (const key of Object.keys(patchPlayer) as (keyof PlayerHand)[]) {
            if (patchPlayer[key] !== localPlayer[key]) {
              (diff as any)[key] = patchPlayer[key];
            }
          }
          return { ...freshPlayer, ...diff };
        });
      } else {
        merged.players = patchPlayers;
      }
    }

    const { error } = await gameService.save(merged);
    if (error) return { error };
    setRecords(prev => prev.map(r => r.oid === oid ? merged : r));
    setLastModifiedAt(Date.now());
    return {};
  }

  async function deleteRecord(oid: string): Promise<{ error?: string }> {
    const { error } = await gameService.remove(oid);
    if (error) return { error };
    setRecords(prev => prev.filter(r => r.oid !== oid));
    setLastModifiedAt(Date.now());
    return {};
  }

  async function savePlayerHand(gameOid: string, player: PlayerHand): Promise<{ error?: string }> {
    const { error } = await gameService.savePlayer(gameOid, player);
    if (!error) setLastModifiedAt(Date.now());
    return error ? { error } : {};
  }

  if (inviteCode) {
    return (
      <InviteRedeemScreen
        code={inviteCode}
        onAuthenticated={u => {
          setInviteCode(null);
          handleAuthenticated(u);
        }}
      />
    );
  }

  if (authLoading || isLoadingRecords) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'primary.main' }} size={40} thickness={3} />
      </Box>
    );
  }

  if (!user) {
    if (location.pathname === '/login') {
      return <AuthScreen initialMode="login" onAuthenticated={handleAuthenticated} />;
    }
    if (location.pathname === '/register') {
      return <AuthScreen initialMode="register" onAuthenticated={handleAuthenticated} />;
    }
    return (
      <LandingPage
        onLogin={() => navigate('/login')}
        onSignUp={() => navigate('/register')}
      />
    );
  }

  const sortedSessions = [...sessions].sort((a, b) => b.dateTime.localeCompare(a.dateTime));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `linear-gradient(rgba(255, 240, 238, 0.38), rgba(255,240,238,0.6)), url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
    <Box sx={{ maxWidth: '80rem', mx: 'auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', px: { xs: '0.75rem', md: '1.5rem' }, py: { xs: '0.75rem', md: '1.5rem' } }}>
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => navigate(TAB_PATHS[tab])}
        isSaving={false}
        user={user}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
        onUserAdded={handleUserAdded}
      />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Box sx={{ display: activeTab !== 'tracker' ? 'none' : 'block' }}>
          <TrackerTab
            sessions={sortedSessions}
            records={records}
            newestSessionId={newestSessionId}
            pendingSessionOids={pendingSessionOids}
            users={users}
            usersMap={usersMap}
            currentUserOid={user!.oid}
            onAddSession={addSession}
            onSaveNewSession={saveNewSession}
            onCancelNewSession={cancelNewSession}
            onUpdateSession={updateSession}
            onDeleteSession={deleteSession}
            onAddGame={addRecord}
            onUpdate={updateRecord}
            onDelete={deleteRecord}
            onUserAdded={handleUserAdded}
            onSavePlayerHand={savePlayerHand}
            onRefresh={refreshData}
            isRefreshing={isRefreshing}
          />
        </Box>
        <Box sx={{ display: activeTab !== 'hands' ? 'none' : 'block' }}>
          <ReferenceTab />
        </Box>
        <Box sx={{ display: activeTab !== 'summary' ? 'none' : 'block' }}>
          <SummaryTab records={records} currentUserOid={user!.oid} users={users} />
        </Box>
        <Box sx={{ display: activeTab !== 'aiSummary' ? 'none' : 'block' }}>
          <AiSummaryTab
            analyses={analyses}
            records={records}
            sessions={sessions}
            users={users}
            usersMap={usersMap}
            currentUserOid={user!.oid}
            lastModifiedAt={lastModifiedAt}
            onAnalysisUpdated={handleAnalysisUpdated}
            onAnalysisDeleted={deleteAnalysis}
          />
        </Box>
      </Box>
    </Box>
    </Box>
  );
}
