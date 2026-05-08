import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import { handData } from '../data/hands';
import type { GameRecord } from '../../model/game.model';
import { TrashIcon } from './icons/Icons';

interface GameRowProps {
  record: GameRecord;
  sessionPlayers: string[];
  onUpdate: (patch: Partial<GameRecord>, skipSave?: boolean) => void;
  onDelete: () => void;
}

export default function GameRow({ record, sessionPlayers, onUpdate, onDelete }: GameRowProps) {
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

  return (
    <>
      <tr className="data-row">
        <td>
          <TextField
            type="date"
            value={record.date}
            size="small"
            onChange={e => onUpdate({ date: e.target.value })}
            sx={{ width: '100%', '& .MuiInputBase-input': { fontSize: '0.75rem', fontWeight: 600 } }}
          />
        </td>
        <td>
          <Select
            value={record.category}
            size="small"
            onChange={e => handleCategoryChange(e.target.value)}
            displayEmpty
            sx={{ width: '100%', fontSize: '0.75rem', fontWeight: 600 }}
          >
            <MenuItem value=""><em>Select...</em></MenuItem>
            {Object.keys(handData).map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </td>
        <td>
          <Select
            value={record.hand}
            size="small"
            onChange={e => handleHandChange(e.target.value)}
            displayEmpty
            sx={{ width: '100%', fontSize: '0.75rem', fontWeight: 600 }}
          >
            <MenuItem value=""><em>Choose Hand</em></MenuItem>
            {categoryHands.map(item => (
              <MenuItem key={item.h} value={item.h}>{item.h}</MenuItem>
            ))}
          </Select>
        </td>
        <td className="center">
          <Select
            value={record.wl}
            size="small"
            onChange={e => onUpdate({ wl: e.target.value as 'Win' | 'Loss' })}
            sx={{ width: '100%', fontSize: '0.75rem', fontWeight: 600 }}
          >
            <MenuItem value="Win">WIN</MenuItem>
            <MenuItem value="Loss">LOSS</MenuItem>
          </Select>
        </td>
        <td>
          <Box
            sx={{
              background: 'rgba(250,208,200,0.6)',
              color: '#0d4a2f',
              fontWeight: 700,
              textAlign: 'center',
              borderRadius: '6px',
              p: '4px',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            }}
          >
            {record.score}
          </Box>
        </td>
        <td>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem 0.75rem', py: '0.25rem' }}>
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
          </Box>
        </td>
        <td className="center">
          <IconButton
            size="small"
            onClick={onDelete}
            sx={{
              color: '#a0b8a8',
              borderRadius: '0.5rem',
              '&:hover': { color: '#ef4444', background: 'rgba(254,242,242,0.8)' },
            }}
          >
            <TrashIcon style={{ width: '1rem', height: '1rem' }} />
          </IconButton>
        </td>
      </tr>
      <tr className="notes-row">
        <td colSpan={7}>
          <TextField
            multiline
            rows={2}
            fullWidth
            placeholder="Notes..."
            value={record.notes}
            size="small"
            onChange={e => onUpdate({ notes: e.target.value }, true)}
            onBlur={() => onUpdate({})}
            sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
          />
        </td>
      </tr>
    </>
  );
}
