import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { handData } from '../data/hands';
import type { GameRecord } from '../../model/game.model';
import type { UserSummary } from '../../model/user.model';
import { TrashIcon } from './icons/Icons';
import { resolveDisplayName } from '../utils/user';

interface GameRowProps {
  record: GameRecord;
  sessionPlayers: string[];
  usersMap: Record<string, UserSummary>;
  onUpdate: (patch: Partial<GameRecord>, skipSave?: boolean) => void;
  onDelete: () => void;
}

export default function GameRow({ record, sessionPlayers, usersMap, onUpdate, onDelete }: GameRowProps) {
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

  return (
    <>
      <tr className="data-row">
        <td>
          <Select value={record.category} size="small" fullWidth displayEmpty
            onChange={e => handleCategoryChange(e.target.value)}>
            <MenuItem value=""><em>Select…</em></MenuItem>
            {Object.keys(handData).map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </Select>
        </td>
        <td>
          <Select value={record.hand} size="small" fullWidth displayEmpty
            onChange={e => handleHandChange(e.target.value)}>
            <MenuItem value=""><em>Choose Hand</em></MenuItem>
            {categoryHands.map(item => <MenuItem key={item.h} value={item.h}>{item.h}</MenuItem>)}
          </Select>
        </td>
        <td className="center">
          <Select value={record.jokers ?? 0} size="small"
            onChange={e => onUpdate({ jokers: Number(e.target.value) })}
            sx={{ width: '4rem' }}>
            {[0,1,2,3,4,5,6,7,8].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </Select>
        </td>
        <td className="center">
          <Select value={record.winner} size="small" fullWidth displayEmpty
            onChange={e => onUpdate({ winner: e.target.value })}>
            <MenuItem value=""><em>Winner…</em></MenuItem>
            {sessionPlayers.map(p => <MenuItem key={p} value={p}>{resolveDisplayName(p, usersMap)}</MenuItem>)}
          </Select>
        </td>
        <td>
          <Chip label={record.score} size="small" color={record.winner ? 'success' : 'default'} />
        </td>
        <td>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: .5 }}>
            {sessionPlayers.map(player => (
              <FormControlLabel key={player} label={resolveDisplayName(player, usersMap)} sx={{ mr: 0, marginLeft: "2px" }}
                control={
                  <Checkbox size="small" checked={record.participants.includes(player)}
                    onChange={e => handleParticipantToggle(player, e.target.checked)} />
                } />
            ))}
          </Box>
        </td>
        <td className="center">
          <IconButton size="small" onClick={onDelete} color="error" aria-label="Delete">
            <TrashIcon style={{ width: '1rem', height: '1rem' }} />
          </IconButton>
        </td>
      </tr>
      <tr className="notes-row">
        <td colSpan={7}>
          <TextField multiline rows={2} fullWidth size="small" placeholder="Notes…"
            value={record.notes}
            onChange={e => onUpdate({ notes: e.target.value }, true)}
            onBlur={() => onUpdate({})} />
        </td>
      </tr>
    </>
  );
}
