# Plan: Frontend Error Handling — Sessions, Games, Auto-saves

## Context

The MahjUp frontend uses optimistic UI updates with fire-and-forget API calls. When a call fails, the UI silently reflects state that was never persisted. For sessions, a "New Session" click immediately fires two API calls (session + first game) but adds everything to state before the calls resolve. If either fails, the user sees a session/game with no DB record. For game auto-saves, every field edit fires calls with no visual feedback and no error handling, giving users false confidence that changes were saved.

The fix has three distinct parts: (1) defer new-session DB writes until "Save Session" is clicked; (2) make "Add Game" block until the server confirms; (3) show a per-game save indicator for all auto-saves and surface errors.

---

## Files to Modify

- `src/App.tsx`
- `src/components/TrackerTab.tsx`
- `src/components/SessionGroup.tsx`
- `src/components/GameRow.tsx`
- `src/components/GameCardMobile.tsx`

---

## Part 1 — App.tsx

### New state
```typescript
const [pendingSessionOids, setPendingSessionOids] = useState<Set<string>>(new Set());
```

### `addSession()` — remove ALL API calls, do not create firstGame yet
```typescript
function addSession() {
  const newSession = makeSession({ userId: user?.oid });
  setSessions(prev => [newSession, ...prev]);
  setPendingSessionOids(prev => new Set([...prev, newSession.oid]));
  setNewestSessionId(newSession.oid);
}
```
The first game is created only after the session successfully saves (see `saveNewSession`).

### New `saveNewSession(oid, patch)` — called by SessionGroup on "Save Session" for pending sessions
```typescript
async function saveNewSession(oid: string, patch: Partial<MahjSession>): Promise<{ error?: string }> {
  const target = sessions.find(s => s.oid === oid);
  if (!target) return { error: 'Session not found' };

  const sessionToSave = { ...target, ...patch };
  const { error: sessionError } = await mahjSessionService.save(sessionToSave);
  if (sessionError) return { error: sessionError };

  // Session confirmed — now create the first game
  const firstGame = makeRecord({
    userId: user?.oid,
    sessionId: oid,
    date: sessionToSave.dateTime.split('T')[0],
    players: user ? [{ userId: user.oid, category: '', hand: '', jokers: 0, isWinner: false, score: 0 }] : [],
  });
  const { error: gameError } = await gameService.save(firstGame);

  // Clear pending regardless — session IS in DB now
  setSessions(prev => prev.map(s => s.oid === oid ? sessionToSave : s));
  setPendingSessionOids(prev => { const next = new Set(prev); next.delete(oid); return next; });
  setRecords(prev => [firstGame, ...prev]);

  if (gameError) {
    // Surface as a warning; the game record is in local state and will be retried on next edit
    return { error: `Session saved, but the first game could not be created: ${gameError}` };
  }
  return {};
}
```
Edge case note: if the session POST succeeds but the game POST fails, we must clear the pending flag immediately (re-posting the session would duplicate it). The first game sits in local state and will be auto-saved when the user first edits it.

### New `cancelNewSession(oid)` — removes unsaved session + its games entirely
```typescript
function cancelNewSession(oid: string) {
  setSessions(prev => prev.filter(s => s.oid !== oid));
  setRecords(prev => prev.filter(r => r.sessionId !== oid));
  setPendingSessionOids(prev => { const next = new Set(prev); next.delete(oid); return next; });
  if (newestSessionId === oid) setNewestSessionId(null);
}
```

### `updateSession()` — no longer optimistic, returns error
```typescript
async function updateSession(oid: string, patch: Partial<MahjSession>): Promise<{ error?: string }> {
  const target = sessions.find(s => s.oid === oid);
  if (!target) return { error: 'Session not found' };
  const updated = { ...target, ...patch };
  const { error } = await mahjSessionService.save(updated);
  if (error) return { error };
  setSessions(prev => prev.map(s => s.oid === oid ? updated : s));
  return {};
}
```

### `addRecord()` — no longer optimistic, returns error
```typescript
async function addRecord(sessionId: string, _sessionPlayers: string[], sessionDate: string): Promise<{ error?: string }> {
  const prevGame = records.filter(r => r.sessionId === sessionId).find(r => r.players.length > 0);
  const blankPlayer = (userId: string): PlayerHand => ({ userId, category: '', hand: '', jokers: 0, isWinner: false, score: 0 });
  const copiedPlayers: PlayerHand[] = prevGame
    ? prevGame.players.filter(p => p.userId).map(p => blankPlayer(p.userId))
    : user ? [blankPlayer(user.oid)] : [];
  const newRecord = makeRecord({ userId: user?.oid, sessionId, date: sessionDate, players: copiedPlayers });
  const { error } = await gameService.save(newRecord);
  if (error) return { error };
  setRecords(prev => [newRecord, ...prev]);
  return {};
}
```

### `updateRecord()` — add return value (keep optimistic setState for responsiveness)
Change `await gameService.save(merged)` at the end to:
```typescript
const { error } = await gameService.save(merged);
if (error) return { error };
return {};
```
And add `return {};` to the `skipSave` early-exit path. Change function signature to `Promise<{ error?: string }>`.

### `savePlayerHand()` — add return value
```typescript
async function savePlayerHand(gameOid: string, player: PlayerHand): Promise<{ error?: string }> {
  const { error } = await gameService.savePlayer(gameOid, player);
  return error ? { error } : {};
}
```

### App.tsx render — pass new props to TrackerTab
```tsx
<TrackerTab
  // ... existing props ...
  pendingSessionOids={pendingSessionOids}
  onSaveNewSession={saveNewSession}
  onCancelNewSession={cancelNewSession}
/>
```

---

## Part 2 — TrackerTab.tsx

### Updated `TrackerTabProps`
Add three new props; change return types of existing callbacks:
```typescript
pendingSessionOids: Set<string>;                                                            // NEW
onSaveNewSession: (oid: string, patch: Partial<MahjSession>) => Promise<{ error?: string }>; // NEW
onCancelNewSession: (oid: string) => void;                                                  // NEW
onUpdateSession: (oid: string, patch: Partial<MahjSession>) => Promise<{ error?: string }>; // return type changed
onAddGame: (sessionId: string, sessionPlayers: string[], sessionDate: string) => Promise<{ error?: string }>; // return type changed
onUpdate: (id: string, patch: Partial<GameRecord>, skipSave?: boolean) => Promise<{ error?: string }>; // return type changed
onSavePlayerHand: (gameOid: string, player: PlayerHand) => Promise<{ error?: string }>;    // return type changed
```

### SessionGroup render — pass new props
```tsx
<SessionGroup
  key={session.oid}
  isPending={pendingSessionOids.has(session.oid)}
  onUpdateSession={patch => onUpdateSession(session.oid, patch)}
  onSaveNewSession={patch => onSaveNewSession(session.oid, patch)}
  onCancelNewSession={() => onCancelNewSession(session.oid)}
  onAddGame={() => onAddGame(session.oid, session.players, sessionDate)}
  // ... all other existing props unchanged ...
/>
```

---

## Part 3 — SessionGroup.tsx

### Updated `SessionGroupProps`
```typescript
isPending: boolean;                                                                         // NEW
onSaveNewSession: (patch: Partial<MahjSession>) => Promise<{ error?: string }>;            // NEW
onCancelNewSession: () => void;                                                             // NEW
onUpdateSession: (patch: Partial<MahjSession>) => Promise<{ error?: string }>;             // return type changed
onAddGame: () => Promise<{ error?: string }>;                                               // return type changed
onUpdate: (id: string, patch: Partial<GameRecord>, skipSave?: boolean) => Promise<{ error?: string }>; // return type changed
onSavePlayerHand: (gameOid: string, player: PlayerHand) => Promise<{ error?: string }>;    // return type changed
```

### New state
```typescript
const [isSaving, setIsSaving] = useState(false);
const [saveError, setSaveError] = useState<string | null>(null);
const [isAddingGame, setIsAddingGame] = useState(false);
const [addGameError, setAddGameError] = useState<string | null>(null);
```

### Remove `isNewSession` ref — replaced by `isPending` prop

### `handleSave()` — async, loading indicator, inline error
```typescript
async function handleSave() {
  setIsSaving(true);
  setSaveError(null);
  const patch = {
    title: editTitle.trim() || undefined,
    dateTime: editDateTime,
    players: editPlayers as authid[],
  };
  const { error } = isPending
    ? await onSaveNewSession(patch)
    : await onUpdateSession(patch);
  setIsSaving(false);
  if (error) {
    setSaveError(error);
    return; // stay in edit mode
  }
  setIsEditing(false);
  if (isPending && games.length > 0) setExpandedGameId(games[0].oid);
}
```

### `handleCancel()` — for pending sessions, remove from state
```typescript
function handleCancel() {
  if (isPending) {
    onCancelNewSession();
    return;
  }
  setEditTitle(session.title ?? '');
  setEditDateTime(session.dateTime);
  setEditPlayers([...session.players]);
  setIsEditing(false);
  setSaveError(null);
}
```

### `handleAddGame()` — async, loading on button, error display
```typescript
async function handleAddGame() {
  setIsAddingGame(true);
  setAddGameError(null);
  const { error } = await onAddGame();
  setIsAddingGame(false);
  if (error) setAddGameError(error);
  // on success the game appears in `games` prop via the existing useEffect
}
```

### Updated "Save Session" button render
```tsx
{/* Error alert above buttons */}
{saveError && (
  <Alert severity="error" onClose={() => setSaveError(null)} sx={{ mb: 1 }}>
    {saveError}
  </Alert>
)}
<Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
  <Button
    variant="contained"
    color="primary"
    onClick={handleSave}
    disabled={isSaving}
    startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
  >
    {isSaving ? 'Saving…' : 'Save Session'}
  </Button>
  <Button variant="outlined" onClick={handleCancel} disabled={isSaving} sx={{ /* existing styles */ }}>
    Cancel
  </Button>
</Stack>
```
`CircularProgress` is already imported in SessionGroup.tsx. Add `Alert` import from `@mui/material/Alert`.

### Updated "Add Game" button render
```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
  {addGameError && (
    <Alert severity="error" onClose={() => setAddGameError(null)} sx={{ fontSize: '0.8125rem', py: 0 }}>
      {addGameError}
    </Alert>
  )}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Button
      size="small"
      onClick={handleAddGame}
      disabled={isAddingGame}
      startIcon={
        isAddingGame
          ? <CircularProgress size={14} color="inherit" />
          : <PlusIcon style={{ width: '0.875rem', height: '0.875rem' }} />
      }
      sx={{ fontSize: '0.75rem', fontWeight: 600 }}
    >
      {isAddingGame ? 'Adding…' : 'Add Game'}
    </Button>
  </Box>
</Box>
```

---

## Part 4 — GameRow.tsx and GameCardMobile.tsx (identical changes to both)

### New imports
```typescript
import Alert from '@mui/material/Alert';
import { useRef, useEffect } from 'react'; // useRef may already be imported
```

### Updated prop interface — change callback return types
```typescript
onUpdate: (patch: Partial<GameRecord>, skipSave?: boolean) => Promise<{ error?: string }>;
onSavePlayerHand: (player: PlayerHand) => Promise<{ error?: string }>;
```

### New state + refs
```typescript
type SaveStatus = 'idle' | 'saving' | 'error' | 'success';
const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
const [saveError, setSaveError] = useState<string | null>(null);
const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => () => { if (successTimerRef.current) clearTimeout(successTimerRef.current); }, []);
```

### Helper to handle save results
```typescript
function handleSaveResult(result: { error?: string }) {
  if (result.error) {
    setSaveStatus('error');
    setSaveError(result.error);
  } else {
    setSaveStatus('success');
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
  }
}
```

### `handlePlayerUpdate()` — make async, track status
```typescript
async function handlePlayerUpdate(idx: number, patch: Partial<PlayerHand>, skipSave?: boolean) {
  // ... existing player merge logic unchanged ...
  if (skipSave || 'userId' in patch) {
    if (!skipSave) {
      setSaveStatus('saving');
      handleSaveResult(await onUpdate({ players: updated }, false));
    } else {
      onUpdate({ players: updated }, true); // state-only, no status tracking
    }
  } else {
    onUpdate({ players: updated }, true);
    const player = updated[idx];
    if (player.userId) {
      setSaveStatus('saving');
      handleSaveResult(await onSavePlayerHand(player));
    }
  }
}
```

### `handleWinnerSelect()` — make async, track status
```typescript
async function handleWinnerSelect(idx: number) {
  // ... existing winner logic unchanged ...
  setSaveStatus('saving');
  handleSaveResult(await onUpdate({ players: updated }));
}
```

### Save indicator — rendered inside the expanded area, before the `<Divider />`
Place this block as the first child inside the `isExpanded &&` section:
```tsx
{saveStatus !== 'idle' && (
  <Box sx={{ px: 2, py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
    {saveStatus === 'saving' && (
      <>
        <Box sx={{
          width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main',
          animation: 'pulse 1.2s ease-in-out infinite',
          '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
        }} />
        <Typography variant="caption" color="text.secondary">Saving…</Typography>
      </>
    )}
    {saveStatus === 'success' && (
      <Typography variant="caption" sx={{ color: 'success.dark' }}>✓ Saved</Typography>
    )}
    {saveStatus === 'error' && (
      <Alert
        severity="error"
        onClose={() => { setSaveStatus('idle'); setSaveError(null); }}
        sx={{ py: 0, fontSize: '0.8125rem', width: '100%' }}
      >
        Changes not saved: {saveError}
      </Alert>
    )}
  </Box>
)}
```

In **GameRow**, the expanded area starts with `{isExpanded && (...)}` — put the indicator as the first child before the `<Divider />`.

In **GameCardMobile**, the expanded area is inside `<Collapse in={isExpanded}>` — same placement before the first `<Divider />`.

---

## Verification

1. **New Session happy path**: Click "New Session" → edit form appears, no network call yet. Enter title/date → click "Save Session" → button shows spinner → session and first game appear. Navigate away and back; session persists.
2. **New Session cancel**: Click "New Session" → click "Cancel" → session disappears entirely from UI.
3. **New Session API failure**: Simulate 500 from `/mahj-session` → error Alert appears under form, button re-enables, session stays in edit mode.
4. **Existing session edit error**: Simulate 500 → error Alert appears, session does NOT update in list.
5. **Add Game loading**: Click "Add Game" → button shows spinner, disabled. On success, game appears. On failure, error Alert appears above button.
6. **Game auto-save indicator**: Change a hand/joker field → green pulsing dot + "Saving…" appears → turns to "✓ Saved" for 2s → disappears.
7. **Game auto-save failure**: Simulate 500 → red error Alert appears inside game card with "Changes not saved: …" message and close button.
