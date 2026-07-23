import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import bgUrl from '../../Assets/mahjong-table-backround.png';
import { adminService, type AdminData } from '../services/admin.service';
import AdminLoginScreen from './AdminLoginScreen';
import AdminHeader from './AdminHeader';
import AdminDataTab from './AdminDataTab';
import AdminStatsTab from './AdminStatsTab';

export type AdminTab = 'data' | 'stats';

const TAB_PATHS: Record<AdminTab, string> = {
  data: '/admin/data',
  stats: '/admin/statistics',
};

const PATH_TO_TAB: Record<string, AdminTab> = {
  '/admin/data': 'data',
  '/admin/statistics': 'stats',
};

const LOGIN_PATH = '/admin/login';

export default function AdminApp() {
  const location = useLocation();
  const navigate = useNavigate();

  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminData | null>(null);

  const activeTab: AdminTab = PATH_TO_TAB[location.pathname] ?? 'data';

  useEffect(() => {
    adminService.getData().then(({ data: fetched }) => {
      if (fetched) {
        setData(fetched);
        setAuthed(true);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!authed && location.pathname !== LOGIN_PATH) {
      navigate(LOGIN_PATH, { replace: true });
    } else if (authed && !PATH_TO_TAB[location.pathname]) {
      navigate(TAB_PATHS.data, { replace: true });
    }
  }, [authed, loading, location.pathname, navigate]);

  async function refresh() {
    const { data: fetched } = await adminService.getData();
    if (fetched) setData(fetched);
  }

  function handleAuthenticated() {
    setAuthed(true);
    refresh();
    navigate(TAB_PATHS.data, { replace: true });
  }

  function handleLogout() {
    adminService.logout();
    setAuthed(false);
    setData(null);
    navigate(LOGIN_PATH, { replace: true });
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'primary.main' }} size={40} thickness={3} />
      </Box>
    );
  }

  if (!authed || !data) {
    return <AdminLoginScreen onAuthenticated={handleAuthenticated} />;
  }

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
        <AdminHeader activeTab={activeTab} onTabChange={tab => navigate(TAB_PATHS[tab])} onLogout={handleLogout} />
        <Box component="main" sx={{ flexGrow: 1 }}>
          {activeTab === 'data' && (
            <AdminDataTab
              users={data.users}
              sessions={data.sessions}
              records={data.records}
              analyses={data.analyses}
            />
          )}
          {activeTab === 'stats' && (
            <AdminStatsTab
              users={data.users}
              sessions={data.sessions}
              records={data.records}
              analyses={data.analyses}
              invites={data.invites}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
