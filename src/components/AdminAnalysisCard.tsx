import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import type { UserSummary } from '../../model/user.model';
import type { GameAnalysis, GameAnalysisTimeRange } from '../../model/game-analysis.model';
import { ChevronDownIcon } from './icons/Icons';
import { resolveDisplayName } from '../utils/user';

interface AdminAnalysisCardProps {
  analysis: GameAnalysis;
  usersMap: Record<string, UserSummary>;
  isExpanded: boolean;
  onToggle: () => void;
}

const TIME_LABELS: Record<GameAnalysisTimeRange, string> = {
  all: 'All Time',
  week: 'Past Week',
  weeks2: 'Past 2 Weeks',
  month: 'Past Month',
  months2: 'Past 2 Months',
  months3: 'Past 3 Months',
  months6: 'Past 6 Months',
  year: 'Past Year',
};

function formatDateTime(ts?: number): string {
  if (!ts) return '—';
  const date = new Date(ts);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dayName}, ${monthName} ${date.getDate()} · ${hours}:${minutes} ${ampm}`;
}

export default function AdminAnalysisCard({ analysis, usersMap, isExpanded, onToggle }: AdminAnalysisCardProps) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid rgba(242,171,164,0.55)' }}>
      <ButtonBase
        onClick={onToggle}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          px: '1rem',
          py: '0.875rem',
          borderBottom: isExpanded ? '1px solid rgba(242,171,164,0.55)' : 'none',
          flexWrap: 'wrap',
          textAlign: 'left',
        }}
      >
        <ChevronDownIcon
          style={{
            width: '1rem',
            height: '1rem',
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: isExpanded ? 'none' : 'rotate(-90deg)',
            color: 'rgba(0,0,0,0.54)',
          }}
        />
        <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
          {TIME_LABELS[analysis.filters.timeRange]}
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
          {formatDateTime(analysis._tsu)}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {analysis.filters.playerIds.length === 0 ? (
            <Chip label="All players" size="small" />
          ) : (
            analysis.filters.playerIds.map(id => (
              <Chip key={id} label={resolveDisplayName(id, usersMap)} size="small" />
            ))
          )}
        </Box>
      </ButtonBase>

      {isExpanded && (
        <Box sx={{ px: '1.25rem', pb: '1.25rem', pt: '1rem' }}>
          <Box sx={{ fontSize: '0.875rem' }} dangerouslySetInnerHTML={{ __html: analysis.content }} />
        </Box>
      )}
    </Paper>
  );
}
