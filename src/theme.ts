import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#e8877a', dark: '#cf6e62', contrastText: '#fff' },
    info: { main: '#e8877a', light: 'rgba(232,135,122,0.15)', dark: '#7a2e24', contrastText: '#fff' },
    text: { primary: '#0a2818', secondary: '#2e5e42' },
    background: { paper: 'rgba(255, 255, 255, 0.88)' },
    divider: 'rgba(242,171,164,0.55)',
  },
  typography: { fontFamily: '"Inter", sans-serif' },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@keyframes ping': {
          '75%, 100%': { transform: 'scale(2)', opacity: 0 },
        },
        '::-webkit-scrollbar': { width: 8, height: 8 },
        '::-webkit-scrollbar-track': { background: 'rgba(195,225,208,0.3)' },
        '::-webkit-scrollbar-thumb': {
          background: 'rgba(232,135,122,0.35)',
          borderRadius: 4,
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(232,135,122,0.6)',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(232,135,122,0.15)',
          borderRadius: '1.5rem',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none' },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            borderRadius: '0.75rem',
            fontWeight: 700,
            boxShadow: '0 4px 6px -1px rgba(232,135,122,0.35)',
            '&:active': { transform: 'scale(0.95)' },
          },
        },
      ],
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiChip: {
      styleOverrides: {
        root: {
          background: 'rgba(46,94,66,0.1)',
          color: '#2e5e42',
          border: '1px solid rgba(46,94,66,0.2)',
          fontSize: '0.75rem',
          height: 24,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: '0.75rem',
          borderRadius: 9999,
          background: 'rgba(250,208,200,0.55)',
        },
        bar: { background: '#e8877a', borderRadius: 9999 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ ownerState }: { ownerState: { severity?: string } }) =>
          ownerState.severity === 'info' ? {
            background: 'rgba(232,135,122,0.15)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            border: '1px solid rgba(232,135,122,0.4)',
            color: '#4a1810',
            borderRadius: '0.75rem',
          } : {},
        icon: ({ ownerState }: { ownerState: { severity?: string } }) =>
          ownerState.severity === 'info' ? { color: '#e8877a' } : {},
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: 'rgba(46,94,66,0.4)',
          padding: '2px',
          '&.Mui-checked': { color: '#e8877a' },
        },
      },
    },
  },
});

export default theme;
