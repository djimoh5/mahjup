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
import Divider from '@mui/material/Divider';
import { handData } from '../data/hands';
import type { GameRecord } from '../../model/game.model';
import { PencilIcon, TrashIcon, CheckIcon } from './icons/Icons';

interface GameCardMobileProps {
  record: GameRecord;
  sessionPlayers: string[];
  onUpdate: (patch: Partial<GameRecord>, skipSave?: boolean) => void;
  onDelete: () => void;
}

export default function GameCardMobile({ record, sessionPlayers, onUpdate, onDelete }: GameCardMobileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const categoryHands = handData[record.category] ?? [];

  function handleCategoryChange(cat: string) { onUpdate({ category: cat, hand: '', score: 0 }); }
  function handleHandChange(hand: string) {
    const match = handData[record.category]?.find(item => item.h === hand);
    onUpdate({ hand, score: match ? match.v : 0 });
  }
  function handleParticipantToggle(player: string, checked: boolean) {
    const updated = checked ? [...record.participants, player] : record.participants.filter(p => p !== player);
    onUpdate({ participants: updated });
  }

  return (
    <Paper elevation={1} variant="outlined">
      {/* Summary row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {record.category && <Typography component="span" variant="body2" color="text.secondary">{record.category} · </Typography>}
          {record.hand || <Typography component="em" variant="body2" color="text.disabled">No hand</Typography>}
        </Typography>
        {record.score > 0 && (
          <Chip label={record.score} size="small" color={record.winner ? 'success' : 'default'} />
        )}
        {record.winner && (
          <Chip label={`W: ${record.winner}`} size="small" color="success" variant="outlined" />
        )}
        {!isEditing && (
          <IconButton size="small" onClick={() => setIsEditing(true)} aria-label="Edit">
            <PencilIcon style={{ width: '1rem', height: '1rem' }} />
          </IconButton>
        )}
      </Box>

      {/* Edit body */}
      {isEditing && (
        <>
          <Divider />
          <Stack spacing={2} sx={{ p: 2 }}>
            <Select value={record.category} size="small" fullWidth displayEmpty
              onChange={e => handleCategoryChange(e.target.value)}>
              <MenuItem value=""><em>Select category…</em></MenuItem>
              {Object.keys(handData).map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
            </Select>

            <Select value={record.hand} size="small" fullWidth displayEmpty disabled={!record.category}
              onChange={e => handleHandChange(e.target.value)}>
              <MenuItem value=""><em>Choose hand…</em></MenuItem>
              {categoryHands.map(item => <MenuItem key={item.h} value={item.h}>{item.h}</MenuItem>)}
            </Select>

            <Select value={record.winner} size="small" fullWidth displayEmpty
              onChange={e => onUpdate({ winner: e.target.value })}>
              <MenuItem value=""><em>Select winner…</em></MenuItem>
              {sessionPlayers.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>

            {sessionPlayers.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">Players</Typography>
                <FormGroup row>
                  {sessionPlayers.map(player => (
                    <FormControlLabel key={player} label={player} sx={{ mr: 1 }}
                      control={<Checkbox size="small" checked={record.participants.includes(player)}
                        onChange={e => handleParticipantToggle(player, e.target.checked)} />} />
                  ))}
                </FormGroup>
              </Box>
            )}

            <TextField label="Notes" multiline rows={2} fullWidth size="small"
              value={record.notes}
              onChange={e => onUpdate({ notes: e.target.value }, true)}
              onBlur={() => onUpdate({})} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" color="error" size="small" onClick={onDelete}
                startIcon={<TrashIcon style={{ width: '1rem', height: '1rem' }} />}>
                Delete
              </Button>
              <Button variant="contained" size="small" onClick={() => setIsEditing(false)}
                startIcon={<CheckIcon style={{ width: '1rem', height: '1rem' }} />}>
                Done
              </Button>
            </Box>
          </Stack>
        </>
      )}
    </Paper>
  );
}
