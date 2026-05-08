import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import type { Tab as AppTab } from '../App';
import logoUrl from '../../Assets/mahjup-logo-white.svg';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
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
    <Box
      component="header"
      sx={{
        background: 'rgba(13,74,47,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '1rem',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        mb: 3,
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          px: '1.5rem',
          py: '1.25rem',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box>
          <img src={logoUrl} alt="MahjUp" style={{ width: 170 }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'rgba(250,208,200,0.8)', ml: '1rem', mt: 0.25 }}>
            {dateStr}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isSaving && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                px: '0.75rem',
                py: '0.25rem',
                background: 'rgba(232,135,122,0.2)',
                border: '1px solid rgba(232,135,122,0.4)',
                borderRadius: '9999px',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              <Box sx={{ position: 'relative', display: 'flex', height: '0.5rem', width: '0.5rem' }}>
                <Box
                  component="span"
                  sx={{
                    position: 'absolute',
                    display: 'inline-flex',
                    height: '100%',
                    width: '100%',
                    borderRadius: '9999px',
                    background: '#e8877a',
                    opacity: 0.75,
                    animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite',
                  }}
                />
                <Box
                  component="span"
                  sx={{
                    position: 'relative',
                    display: 'inline-flex',
                    borderRadius: '9999px',
                    height: '0.5rem',
                    width: '0.5rem',
                    background: '#e8877a',
                  }}
                />
              </Box>
              Syncing
            </Box>
          )}
          <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(250,208,200,0.9)' }}>
            {username}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={onLogout}
            sx={{
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '0.5rem',
              background: 'rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.75rem',
              fontWeight: 600,
              minWidth: 'unset',
              '&:hover': {
                background: 'rgba(255,255,255,0.25)',
                borderColor: 'rgba(255,255,255,0.65)',
              },
            }}
          >
            Sign Out
          </Button>
        </Box>
      </Box>

      {/* Nav tabs */}
      <Box sx={{ background: 'rgba(46,94,66,0.88)', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => onTabChange(v as AppTab)}
          sx={{
            px: 2,
            '& .MuiTabs-indicator': { background: '#e8877a', height: 3, borderRadius: '3px 3px 0 0' },
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              minHeight: 52,
              fontFamily: '"Inter", sans-serif',
            },
            '& .MuiTab-root:hover': { color: 'rgba(255,255,255,0.9)' },
            '& .Mui-selected': { color: '#e8877a !important', fontWeight: 600 },
          }}
        >
          <Tab label="My Tracker" value="tracker" />
          <Tab label="2026 NMJL Reference" value="hands" />
          <Tab label="Summary Insights" value="summary" />
        </Tabs>
      </Box>
    </Box>
  );
}
