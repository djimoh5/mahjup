import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { keyframes } from '@emotion/react';
import { gameService } from '../services/game.service';

const wave = keyframes`
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scaleY(0.6); }
  50% { opacity: 1; transform: scaleY(1); }
`;

const cardSx = {
  mb: 3,
  p: '1.25rem 1.5rem',
  background: 'rgba(255,255,255,0.88)',
  borderRadius: '1rem',
  border: '1px solid rgba(242,171,164,0.35)',
  backdropFilter: 'blur(8px)',
};

export default function AiSummary() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [summary, setSummary] = useState<string | null>(null);

  async function handleAnalyze() {
    setStatus('loading');
    const { summary: text } = await gameService.getSummary();
    setSummary(text || null);
    setStatus('done');
  }

  if (status === 'idle') {
    return (
      <Box sx={{ ...cardSx, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {['#4285F4', '#9B72CB', '#D96570'].map(color => (
              <Box key={color} sx={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: color }} />
            ))}
          </Box>
          <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
            Get an AI-powered analysis of your game performance
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={handleAnalyze}
          sx={{
            borderColor: 'rgba(155,114,203,0.5)',
            color: '#9B72CB',
            fontSize: '0.8125rem',
            whiteSpace: 'nowrap',
            '&:hover': { borderColor: '#9B72CB', background: 'rgba(155,114,203,0.06)' },
          }}
        >
          Analyze My Games
        </Button>
      </Box>
    );
  }

  if (status === 'loading') {
    return (
      <Box sx={cardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {['#4285F4', '#9B72CB', '#D96570'].map((color, i) => (
              <Box
                key={color}
                sx={{
                  width: '8px',
                  height: '16px',
                  borderRadius: '4px',
                  backgroundColor: color,
                  animation: `${pulse} 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </Box>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', fontStyle: 'italic' }}>
            Analyzing your games with AI…
          </Typography>
        </Box>
        <Box
          sx={{
            height: '6px',
            borderRadius: '3px',
            background: 'linear-gradient(90deg, #4285F4, #9B72CB, #D96570, #9B72CB, #4285F4)',
            backgroundSize: '200% auto',
            animation: `${wave} 2s linear infinite`,
          }}
        />
      </Box>
    );
  }

  return (
    <Accordion
      defaultExpanded
      sx={{
        mb: 3,
        background: 'rgba(255,255,255,0.88)',
        borderRadius: '1rem !important',
        border: '1px solid rgba(242,171,164,0.35)',
        backdropFilter: 'blur(8px)',
        boxShadow: 'none',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
          </svg>
        }
        sx={{ px: '1.5rem', minHeight: '3rem', '& .MuiAccordionSummary-content': { my: '0.75rem' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {['#4285F4', '#9B72CB', '#D96570'].map(color => (
              <Box key={color} sx={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: color }} />
            ))}
          </Box>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>AI Game Analysis</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: '1.5rem', pt: 0, pb: '1.25rem' }}>
        <Box
          sx={{
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            color: 'text.primary',
            '& h1, & h2, & h3, & h4': { mt: 0, mb: 0.75, fontSize: '1rem', fontWeight: 600 },
            '& p': { mt: 0, mb: 1 },
            '& p:last-child': { mb: 0 },
            '& ul, & ol': { pl: '1.5rem', mt: 0, mb: 1 },
            '& li': { mb: 0.25 },
          }}
          dangerouslySetInnerHTML={{ __html: summary! }}
        />
      </AccordionDetails>
    </Accordion>
  );
}
