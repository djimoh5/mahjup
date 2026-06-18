import React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { handData, SegmentColor } from '../data/hands';

const SEGMENT_COLORS: Record<SegmentColor, string> = {
  green: '#2e7d32',
  blue: '#020736',
  red: '#c62828',
};

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
                background: 'rgba(232,135,122,0.07)',
                borderBottom: '1px solid rgba(232,135,122,0.18)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.075em', color: '#1a1a1a' }}>
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
                  color: '#1a1a1a',
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                    <Typography component="span" sx={{ color: '#2e5e42', fontFamily: 'monospace', fontSize: '0.6875rem' }}>
                      {h.s ? (
                        <>
                          {h.s.map((seg, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && ' '}
                              <span style={{ color: seg.c ? SEGMENT_COLORS[seg.c] : 'inherit', fontWeight: seg.c ? 700 : undefined }}>
                                {seg.t}
                              </span>
                            </React.Fragment>
                          ))}
                          {h.s2 && (
                            <>
                              <span style={{ color: '#888', fontWeight: 400 }}> -or- </span>
                              {h.s2.map((seg, i) => (
                                <React.Fragment key={i}>
                                  {i > 0 && ' '}
                                  <span style={{ color: seg.c ? SEGMENT_COLORS[seg.c] : 'inherit', fontWeight: seg.c ? 700 : undefined }}>
                                    {seg.t}
                                  </span>
                                </React.Fragment>
                              ))}
                            </>
                          )}
                        </>
                      ) : h.h}
                    </Typography>
                    {h.d && (
                      <Typography component="span" sx={{ color: '#6b8f78', fontFamily: 'monospace', fontSize: '0.5625rem', fontStyle: 'italic' }}>
                        ({h.d})
                      </Typography>
                    )}
                  </Box>
                  <Typography component="span" sx={{ fontWeight: 900, fontSize: '0.75rem', fontFamily: 'monospace', flexShrink: 0 }}>
                    <span style={{ color: h.closed ? SEGMENT_COLORS.blue : SEGMENT_COLORS.red }}>{h.closed ? 'C' : 'X'}</span>
                    <span style={{ color: SEGMENT_COLORS.blue }}> {h.v}</span>
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
