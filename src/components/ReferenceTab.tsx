import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { handData } from '../data/hands';

export default function ReferenceTab() {
  return (
    <Box
      sx={{
        columns: { xs: 1, sm: 2, lg: 3 },
        columnGap: '24px',
        '& > *': { breakInside: 'avoid', marginBottom: '24px' },
      }}
    >
      {Object.entries(handData).map(([category, hands]) => (
        <Box key={category} sx={{ display: 'inline-block', width: '100%' }}>
          <Paper
            sx={{
              borderRadius: '1.5rem',
              overflow: 'hidden',
              border: '1px solid rgba(232,135,122,0.15)',
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box
              sx={{
                px: '1.25rem',
                py: '0.75rem',
                background: 'rgba(46,94,66,0.12)',
                borderBottom: '1px solid rgba(242,171,164,0.35)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.075em', color: '#0d4a2f' }}>
                {category}
              </Typography>
              <Chip
                label={`${hands.length} Hands`}
                size="small"
                sx={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(232,135,122,0.25)',
                  borderRadius: '9999px',
                  fontSize: '0.5625rem',
                  fontWeight: 900,
                  color: '#2e5e42',
                  height: 22,
                }}
              />
            </Box>
            <Box sx={{ p: '1.25rem', fontFamily: 'monospace', fontSize: '0.6875rem', lineHeight: 1.6 }}>
              {hands.map(h => (
                <Box
                  key={h.h}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    py: '0.5rem',
                    borderBottom: '1px solid rgba(242,171,164,0.3)',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Typography component="span" sx={{ color: '#2e5e42', fontFamily: 'monospace', fontSize: '0.6875rem' }}>
                    {h.h}
                  </Typography>
                  <Typography component="span" sx={{ fontWeight: 900, fontSize: '0.75rem', color: 'primary.main', fontFamily: 'monospace', flexShrink: 0 }}>
                    {h.v}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      ))}
    </Box>
  );
}
