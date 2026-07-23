import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import type { AdminTab } from './AdminApp';
import logoUrl from '../../Assets/mahjup-logo-dark.png';

interface AdminHeaderProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
}

export default function AdminHeader({ activeTab, onTabChange, onLogout }: AdminHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        background: '#fff',
        border: '1px solid rgba(242, 171, 164, 0.55)',
        borderRadius: '1rem',
        boxShadow: '0 4px 20px rgba(232,135,122,0.1), 0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        mb: 3,
      }}
    >
      <Box
        sx={{
          px: '1.5rem',
          py: '1.25rem',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          background: '#fcfcfc',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={logoUrl} alt="MahjUp" style={{ width: 170 }} />
          <Chip
            label="ADMIN PORTAL"
            size="small"
            sx={{ background: 'rgba(30,30,30,0.9)', color: '#fff', fontWeight: 700, letterSpacing: '0.05em', fontSize: '0.65rem', border: 'none' }}
          />
        </Box>

        <Button
          onClick={onLogout}
          size="small"
          sx={{ color: 'text.secondary', fontWeight: 600, '&:hover': { color: 'error.main', background: 'transparent' } }}
        >
          Log Out
        </Button>
      </Box>

      <Box sx={{ background: '#fffcfc', borderTop: '1px solid rgba(242, 171, 164, 0.55)' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => onTabChange(v as AdminTab)}
          sx={{
            px: 2,
            '& .MuiTabs-indicator': { background: '#e8877a', height: 3, borderRadius: '3px 3px 0 0' },
            '& .MuiTab-root': {
              color: 'rgba(0,0,0,0.4)',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              minHeight: 52,
              fontFamily: '"Inter", sans-serif',
            },
            '& .MuiTab-root:hover': { color: 'rgba(0,0,0,0.75)' },
            '& .Mui-selected': { color: '#e8877a !important', fontWeight: 600 },
          }}
        >
          <Tab label="Data" value="data" />
          <Tab label="Statistics" value="stats" />
        </Tabs>
      </Box>
    </Box>
  );
}
