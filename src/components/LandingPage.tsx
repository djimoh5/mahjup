import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import darkLogoUrl from '../../Assets/mahjup-logo-dark.png';
import bgUrl from '../../Assets/mahjong-table-backround.png';
import HeroPreview from './HeroPreview';

interface Props {
  onLogin: () => void;
  onSignUp: () => void;
}

const PINK = '#e8877a';

function IconTrack() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="18" y="3" width="4" height="18" /><rect x="10" y="8" width="4" height="13" /><rect x="2" y="13" width="4" height="8" />
    </svg>
  );
}

function IconAnalyze() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconSessions() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconImprove() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

const STATS = [
  { Icon: IconTrack, value: 'Track', label: 'Every game, hand, and player logged automatically' },
  { Icon: IconAnalyze, value: 'Analyze', label: 'See your winning patterns and weak spots' },
  { Icon: IconSessions, value: 'Sessions', label: 'Schedule and share games with your group' },
  { Icon: IconImprove, value: 'Improve', label: 'Get smarter with every hand you play' },
];

export default function LandingPage({ onLogin, onSignUp }: Props) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: `linear-gradient(rgba(255,240,238,0.6), rgba(255,240,238,0.6)), url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      

      {/* Header */}
      <Box
        component="header"
        sx={{
          px: { xs: 3, md: 7 },
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: '#fff',
          borderBottom: '1px solid rgba(232,135,122,0.15)',
        }}
      >
        <img src={darkLogoUrl} alt="MahjUp" style={{ width: 150 }} />

        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1.5 }, alignItems: 'center' }}>
          <Button
            onClick={onLogin}
            variant="outlined"
            sx={{
              color: 'rgba(0,0,0,0.75)',
              borderColor: 'rgba(0,0,0,0.2)',
              borderRadius: '2rem',
              fontWeight: 600,
              textTransform: 'none',
              px: { xs: 1.5, sm: 3 },
              '&:hover': {
                borderColor: 'rgba(0,0,0,0.45)',
                background: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            Log In
          </Button>
          <Button
            onClick={onSignUp}
            variant="contained"
            sx={{
              background: PINK,
              borderRadius: '2rem',
              fontWeight: 700,
              textTransform: 'none',
              px: { xs: 2, sm: 3.5 },
              boxShadow: '0 4px 18px rgba(232,135,122,0.4)',
              '&:hover': { background: '#cf6e62' },
            }}
          >
            Sign Up
          </Button>
        </Box>
      </Box>

      {/* Spacer to offset fixed header */}
      <Box sx={{ height: '80px', flexShrink: 0 }} />

      {/* Hero */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          px: { xs: 3, md: 7 },
          py: { xs: 6, md: 8 },
          gap: { md: 8 },
          flexDirection: { xs: 'column', md: 'row' },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Left: copy */}
        <Box sx={{ flex: '0 0 auto', maxWidth: { xs: '100%', md: 540 } }}>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 800,
              color: '#1a1a1a',
              fontSize: { xs: '2.4rem', md: '3.5rem' },
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
              mb: 2.5,
            }}
          >
            Track Every Hand.{' '}
            <Box component="span" sx={{ color: PINK }}>
              Master Your Game.
            </Box>
          </Typography>

          <Typography
            sx={{
              color: 'rgba(0,0,0,0.5)',
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.75,
              mb: 4.5,
              maxWidth: 460,
            }}
          >
            MahjUp is an AI-powered Mahjong tracker that logs every game, surfaces
            your winning patterns, and helps you improve with every session you play.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
            <Button
              onClick={onSignUp}
              variant="contained"
              size="large"
              sx={{
                background: PINK,
                borderRadius: '2rem',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '1rem',
                px: 4.5,
                py: '0.9rem',
                boxShadow: '0 6px 28px rgba(232,135,122,0.45)',
                '&:hover': { background: '#cf6e62' },
              }}
            >
              Get Started Free
            </Button>
            <Button
              onClick={onLogin}
              sx={{
                color: 'rgba(0,0,0,0.45)',
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '0.9375rem',
                borderRadius: '2rem',
                px: 2,
                '&:hover': { background: 'rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.75)' },
              }}
            >
              Already have an account →
            </Button>
          </Box>
        </Box>

        {/* Mobile hero preview */}
        <Box sx={{
          display: { xs: 'block', md: 'none' },
          width: '100%',
          mt: 3,
          position: 'relative',
          height: { xs: 245, sm: 355 },
          overflow: 'hidden',
        }}>
          <Box sx={{
            position: 'absolute',
            width: 640,
            height: 440,
            top: 0,
            left: { xs: 'calc(50% - 195px)', sm: 'calc(50% - 284px)' },
            transform: { xs: 'scale(0.55)', sm: 'scale(0.8)' },
            transformOrigin: 'top left',
          }}>
            <HeroPreview />
          </Box>
        </Box>

        {/* Right: floating UI preview */}
        <Box
          sx={{
            flex: 1,
            display: { xs: 'none', md: 'flex' },
            justifyContent: 'flex-end',
            alignItems: 'center',
            pr: 2,
          }}
        >
          <HeroPreview />
        </Box>
      </Box>

      {/* Stats strip */}
      <Box
        sx={{
          borderTop: '1px solid rgba(232,135,122,0.15)',
          background: '#fff',
          px: { xs: 3, md: 7 },
          py: { xs: 3.5, md: 4 },
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 4, md: 2 },
          justifyContent: { xs: 'flex-start', md: 'space-between' },
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {STATS.map(({ Icon, value, label }, i) => (
          <Box key={value} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {i > 0 && (
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: 'rgba(232,135,122,0.18)', display: { xs: 'none', md: 'block' } }}
              />
            )}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Box sx={{ mt: 0.25, flexShrink: 0 }}>
                <Icon />
              </Box>
              <Box>
                <Typography sx={{ color: '#1a1a1a', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
                  {value}
                </Typography>
                <Typography sx={{ color: 'rgba(0,0,0,0.42)', fontSize: '0.78rem', mt: 0.4, maxWidth: 200 }}>
                  {label}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
