import { useState, useEffect, useMemo } from 'react';
import bgUrl from '../Assets/mahjong-table-backround.png';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import type { GameRecord, PlayerHand } from '../model/game.model';
import type { MahjSession } from '../model/mahj-session.model';
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

export type Tab = 'tracker' | 'hands' | 'summary';

const TAB_PATHS: Record<Tab, string> = {
  tracker: '/tracker',
  hands: '/reference',
  summary: '/summary',
};

const PATH_TO_TAB: Record<string, Tab> = {
  '/tracker': 'tracker',
  '/reference': 'hands',
  '/summary': 'summary',
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
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [newestSessionId, setNewestSessionId] = useState<string | null>(null);

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
    ]).then(([{ sessions: fetchedSessions }, { records: fetchedRecords }, { users: fetchedUsers }]) => {
      setSessions(fetchedSessions);
      setRecords(fetchedRecords.map(r => ({ ...r, players: r.players ?? [] })));
      setUsers(fetchedUsers);
    }).catch(() => {}).finally(() => {
      setIsLoadingRecords(false);
    });
  }, [user]);

  async function refreshData() {
    if (!user || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const [{ sessions: fetchedSessions }, { records: fetchedRecords }, { users: fetchedUsers }] = await Promise.all([
        mahjSessionService.getAll(),
        gameService.getAll(),
        userService.getAffiliated().catch(() => ({ users: [] as UserSummary[] })),
      ]);
      setSessions(fetchedSessions);
      setRecords(fetchedRecords.map(r => ({ ...r, players: r.players ?? [] })));
      setUsers(fetchedUsers);
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

  function handleUserAdded(newUser: UserSummary) {
    setUsers(prev => [...prev, newUser]);
  }

  async function addSession() {
    const newSession = makeSession({ userId: user?.oid });
    const firstGame = makeRecord({ userId: user?.oid, sessionId: newSession.oid, date: newSession.dateTime.split('T')[0], players: user ? [{ userId: user.oid, category: '', hand: '', jokers: 0, isWinner: false, score: 0 }] : [] });
    setSessions(prev => [newSession, ...prev]);
    setRecords(prev => [firstGame, ...prev]);
    setNewestSessionId(newSession.oid);
    await Promise.all([mahjSessionService.save(newSession), gameService.save(firstGame)]);
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

  async function addRecord(sessionId: string, _sessionPlayers: string[], sessionDate: string) {
    const prevGame = records.filter(r => r.sessionId === sessionId).find(r => r.players.length > 0);
    const blankPlayer = (userId: string): PlayerHand => ({ userId, category: '', hand: '', jokers: 0, isWinner: false, score: 0 });
    const copiedPlayers: PlayerHand[] = prevGame
      ? prevGame.players.filter(p => p.userId).map(p => blankPlayer(p.userId))
      : user ? [blankPlayer(user.oid)] : [];
    const newRecord = makeRecord({ userId: user?.oid, sessionId, date: sessionDate, players: copiedPlayers });
    setRecords(prev => [newRecord, ...prev]);
    await gameService.save(newRecord);
  }

  async function updateRecord(oid: string, patch: Partial<GameRecord>, skipSave?: boolean) {
    setRecords(prev => prev.map(r => (r.oid === oid ? { ...r, ...patch } : r)));

    if (!skipSave) {
      const localRecord = records.find(r => r.oid === oid);
      const { record: fresh } = await gameService.getRecord(oid);
      const base = fresh ?? localRecord;
      if (!base) return;

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
            // Apply only the fields that actually changed from local to patch
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

      setRecords(prev => prev.map(r => r.oid === oid ? merged : r));
      await gameService.save(merged);
    }
  }

  async function deleteRecord(oid: string) {
    setRecords(prev => prev.filter(r => r.oid !== oid));
    await gameService.remove(oid);
  }

  async function savePlayerHand(gameOid: string, player: PlayerHand) {
    await gameService.savePlayer(gameOid, player);
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
            users={users}
            usersMap={usersMap}
            currentUserOid={user!.oid}
            onAddSession={addSession}
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
      </Box>
    </Box>
    </Box>
  );
}
