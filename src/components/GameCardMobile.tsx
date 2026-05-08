import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { handData } from '../data/hands';
import type { GameRecord } from '../../model/game.model';
import { PencilIcon, TrashIcon, CheckIcon } from './icons/Icons';

interface GameCardMobileProps {
  record: GameRecord;
  sessionPlayers: string[];
  onUpdate: (patch: Partial<GameRecord>, skipSave?: boolean) => void;
  onDelete: () => void;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

export default function GameCardMobile({ record, sessionPlayers, onUpdate, onDelete }: GameCardMobileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const categoryHands = handData[record.category] ?? [];

  function handleCategoryChange(cat: string) {
    onUpdate({ category: cat, hand: '', score: 0 });
  }

  function handleHandChange(hand: string) {
    const match = handData[record.category]?.find(item => item.h === hand);
    onUpdate({ hand, score: match ? match.v : 0 });
  }

  function handleParticipantToggle(player: string, checked: boolean) {
    const updated = checked
      ? [...record.participants, player]
      : record.participants.filter(p => p !== player);
    onUpdate({ participants: updated });
  }

  const participants = record.participants;
  const isWin = record.wl === 'Win';

  return (
    <Paper
      sx={{
        borderRadius: '0.875rem',
        overflow: 'hidden',
        border: isEditing ? '1px solid #e8877a' : '1px solid rgba(242,171,164,0.55)',
        boxShadow: isEditing ? '0 4px 16px -2px rgba(232,135,122,0.25)' : undefined,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Summary row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', px: '0.875rem', py: '0.625rem', minHeight: '3rem' }}>
        <Typography
          sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap', flexShrink: 0, minWidth: '6rem' }}
        >
          {formatDate(record.date)}
        </Typography>
        <Typography
          sx={{ flex: 1, fontSize: '0.75rem', fontWeight: 600, color: 'text.primary', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
        >
          {record.category && <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>{record.category} · </Typography>}
          {record.hand || <Typography component="em" sx={{ color: 'text.secondary', fontWeight: 400, fontStyle: 'italic' }}>No hand</Typography>}
        </Typography>
        {record.score > 0 && (
          <Box
            sx={{
              flexShrink: 0,
              background: 'rgba(250,208,200,0.6)',
              color: '#0d4a2f',
              fontWeight: 700,
              borderRadius: '6px',
              px: '6px',
              py: '2px',
              fontFamily: 'monospace',
              fontSize: '0.6875rem',
            }}
          >
            {record.score}
          </Box>
        )}
        <Chip
          label={isWin ? 'WIN' : 'LOSS'}
          size="small"
          sx={{
            fontSize: '0.625rem',
            fontWeight: 900,
            letterSpacing: '0.08em',
            height: 20,
            flexShrink: 0,
            background: isWin ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)',
            color: isWin ? '#065f46' : '#991b1b',
            border: 'none',
          }}
        />
        {!isEditing && (
          <IconButton
            size="small"
            onClick={() => setIsEditing(true)}
            aria-label="Edit"
            sx={{
              flexShrink: 0,
              color: 'text.secondary',
              '&:hover': { color: 'primary.main', background: 'rgba(232,135,122,0.1)' },
            }}
          >
            <PencilIcon style={{ width: '1rem', height: '1rem' }} />
          </IconButton>
        )}
      </Box>

      {/* Edit body */}
      {isEditing && (
        <Stack spacing={1.5} sx={{ px: '0.875rem', pt: '0.875rem', pb: '0.875rem', borderTop: '1px solid rgba(242,171,164,0.55)' }}>
          <Box>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'text.secondary', mb: 0.5 }}>
              Date
            </Typography>
            <TextField
              type="date"
              value={record.date}
              size="small"
              fullWidth
              onChange={e => onUpdate({ date: e.target.value })}
            />
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'text.secondary', mb: 0.5 }}>
              Category
            </Typography>
            <Select
              value={record.category}
              size="small"
              fullWidth
              displayEmpty
              onChange={e => handleCategoryChange(e.target.value)}
            >
              <MenuItem value=""><em>Select...</em></MenuItem>
              {Object.keys(handData).map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'text.secondary', mb: 0.5 }}>
              Exact Hand
            </Typography>
            <Select
              value={record.hand}
              size="small"
              fullWidth
              displayEmpty
              disabled={!record.category}
              onChange={e => handleHandChange(e.target.value)}
            >
              <MenuItem value=""><em>Choose Hand</em></MenuItem>
              {categoryHands.map(item => (
                <MenuItem key={item.h} value={item.h}>{item.h}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'text.secondary', mb: 0.5 }}>
              Result
            </Typography>
            <Select
              value={record.wl}
              size="small"
              fullWidth
              onChange={e => onUpdate({ wl: e.target.value as 'Win' | 'Loss' })}
            >
              <MenuItem value="Win">WIN</MenuItem>
              <MenuItem value="Loss">LOSS</MenuItem>
            </Select>
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'text.secondary', mb: 0.5 }}>
              Points
            </Typography>
            <Box
              sx={{
                display: 'inline-block',
                background: 'rgba(250,208,200,0.6)',
                color: '#0d4a2f',
                fontWeight: 700,
                borderRadius: '6px',
                px: '8px',
                py: '4px',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              }}
            >
              {record.score}
            </Box>
          </Box>

          {sessionPlayers.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'text.secondary', mb: 0.5 }}>
                Players
              </Typography>
              <FormGroup row sx={{ gap: '0.375rem 0.75rem' }}>
                {sessionPlayers.map(player => (
                  <FormControlLabel
                    key={player}
                    label={player}
                    sx={{ margin: 0, '& .MuiFormControlLabel-label': { fontSize: '0.8125rem', color: 'text.primary' } }}
                    control={
                      <Checkbox
                        size="small"
                        checked={participants.includes(player)}
                        onChange={e => handleParticipantToggle(player, e.target.checked)}
                      />
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          <Box>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'text.secondary', mb: 0.5 }}>
              Notes
            </Typography>
            <TextField
              multiline
              rows={3}
              fullWidth
              size="small"
              placeholder="Notes..."
              value={record.notes}
              onChange={e => onUpdate({ notes: e.target.value }, true)}
              onBlur={() => onUpdate({})}
            />
          </Box>

          {/* Footer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pt: '0.5rem',
              borderTop: '1px solid rgba(242,171,164,0.55)',
              mt: '0.25rem',
            }}
          >
            <Button
              variant="text"
              onClick={onDelete}
              startIcon={<TrashIcon style={{ width: '1rem', height: '1rem' }} />}
              sx={{
                color: '#a0b8a8',
                fontSize: '0.75rem',
                fontWeight: 600,
                '&:hover': { color: '#ef4444', background: 'rgba(254,242,242,0.8)' },
              }}
            >
              Delete
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsEditing(false)}
              startIcon={<CheckIcon style={{ width: '1rem', height: '1rem' }} />}
              sx={{ borderRadius: '0.625rem', fontSize: '0.8125rem', py: '0.5rem', px: '1.125rem' }}
            >
              Done
            </Button>
          </Box>
        </Stack>
      )}
    </Paper>
  );
}
