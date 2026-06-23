import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { keyframes } from '@emotion/react';
import { gameService } from '../services/game.service';
import type { GameAnalysis } from '../../model/game-analysis.model';
import type { GameRecord } from '../../model/game.model';
import type { MahjSession } from '../../model/mahj-session.model';

const wave = keyframes`
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
`;

const cardSx = {
  mb: 3,
  p: '1.25rem 1.5rem',
  background: 'rgba(255,255,255,0.88)',
  borderRadius: '1rem',
  border: '1px solid rgba(242,171,164,0.35)',
  backdropFilter: 'blur(8px)',
};

interface AiSummaryProps {
  analysis: GameAnalysis | null;
  lastModifiedAt: number;
  records: GameRecord[];
  sessions: MahjSession[];
  onAnalysisUpdated: (analysis: GameAnalysis) => void;
}

export default function AiSummary({ analysis, lastModifiedAt, records, sessions, onAnalysisUpdated }: AiSummaryProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>(() => analysis ? 'done' : 'idle');
  const [summary, setSummary] = useState<string | null>(() => analysis?.content ?? null);
  const [accordionOpen, setAccordionOpen] = useState(false);

  useEffect(() => {
    if (analysis) {
      setSummary(analysis.content);
      setStatus('done');
    }
  }, [analysis]);

  const analysisTsu = analysis?._tsu ?? 0;
  const isStale = analysisTsu > 0 && (
    lastModifiedAt > analysisTsu ||
    records.some(r => (r._tsu ?? 0) > analysisTsu) ||
    sessions.some(s => (s._tsu ?? 0) > analysisTsu)
  );

  async function handleAnalyze() {
    setStatus('loading');
    const { summary: text } = await gameService.getSummary();
    setSummary(text || null);
    setStatus('done');
    setAccordionOpen(true);
    const { analysis: fresh } = await gameService.getAnalysis();
    if (fresh) onAnalysisUpdated(fresh);
  }

  if (status === 'idle') {
    return (
      <Box sx={{ ...cardSx, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
          Get an AI-powered analysis of your game performance
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleAnalyze}
          sx={{
            borderColor: 'rgba(232,135,122,0.5)',
            color: '#cf6e62',
            fontSize: '0.8125rem',
            whiteSpace: 'nowrap',
            '&:hover': { borderColor: '#e8877a', background: 'rgba(232,135,122,0.06)' },
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
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', fontStyle: 'italic', mb: 1.5 }}>
          Analyzing your games with AI…
        </Typography>
        <Box
          sx={{
            height: '6px',
            borderRadius: '3px',
            background: 'linear-gradient(90deg, #f0a89f, #e8877a, #cf6e62, #e8877a, #f0a89f)',
            backgroundSize: '200% auto',
            animation: `${wave} 2s linear infinite`,
          }}
        />
      </Box>
    );
  }

  return (
    <Accordion
      expanded={accordionOpen}
      onChange={(_, open) => setAccordionOpen(open)}
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>AI Game Analysis</Typography>
          {isStale && (
            <Button
              size="small"
              onClick={e => { e.stopPropagation(); handleAnalyze(); }}
              sx={{
                borderColor: 'rgba(232,135,122,0.5)',
                color: '#cf6e62',
                fontSize: '0.75rem',
                border: '1px solid',
                px: 1.25,
                py: 0.25,
                minHeight: 'unset',
                lineHeight: 1.5,
                '&:hover': { borderColor: '#e8877a', background: 'rgba(232,135,122,0.06)' },
              }}
            >
              Update Analysis
            </Button>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: '1.5rem', pt: 0, pb: '1.25rem' }}>
        <Box
          sx={{
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            color: 'text.primary',
            '& h1, & h2, & h3, & h4': { mt: 2.0, mb: 0.75, fontSize: '1rem', fontWeight: 600, borderBottom: '2px solid rgba(235, 120, 152, 0.35)' },
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
