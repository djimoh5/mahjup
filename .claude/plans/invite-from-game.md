# Plan: Invite New Player from Game Row Winner Field

## Context

Currently, players can only be added to a MahjSession via the session-level Players field (in edit mode). If a user forgets to invite someone before recording games, they must go back and edit the session. This plan adds an "Invite new player" option as the first item in the Winner dropdown on each game row. When submitted, it immediately adds the player to the session, marks them as a participant, and selects them as the winner of that game.

---

## Files to Modify

1. [src/components/GameRow.tsx](src/components/GameRow.tsx) — add `onInvitePlayer` prop, add sentinel menu item
2. [src/components/GameCardMobile.tsx](src/components/GameCardMobile.tsx) — same changes for mobile
3. [src/components/SessionGroup.tsx](src/components/SessionGroup.tsx) — track which game triggered the invite, update post-invite logic

---

## Implementation Steps

### 1. `GameRow.tsx` — Add invite option to winner dropdown

Add `onInvitePlayer: () => void` to `GameRowProps`.

In the winner `Select`'s `onChange`, intercept the `__invite__` sentinel:
```tsx
onChange={e => {
  if (e.target.value === '__invite__') {
    onInvitePlayer();
  } else {
    onUpdate({ winner: e.target.value });
  }
}}
```

Add the invite menu item as the **first** option (after the empty placeholder):
```tsx
<MenuItem value=""><em>Winner…</em></MenuItem>
<MenuItem value="__invite__" sx={{ color: 'primary.main', fontWeight: 500 }}>
  + Invite new player…
</MenuItem>
{sessionPlayers.map(p => ...)}
```

### 2. `GameCardMobile.tsx` — Mirror the same changes

Add `onInvitePlayer: () => void` to `GameCardMobileProps`.

Apply the same `onChange` intercept and first menu item to the winner `Select` (lines 92–96).

### 3. `SessionGroup.tsx` — Handle game-level invite flow

**Add state:**
```tsx
const [inviteFromGameOid, setInviteFromGameOid] = useState<string | null>(null);
```

**Add a handler for game-row-triggered invites:**
```tsx
function handleGameInvite(gameOid: string) {
  setInviteFromGameOid(gameOid);
  setInviteOpen(true);
}
```

**Update `handleInviteConfirm`** — after a successful invite, branch on whether it was game-triggered or session-triggered:

```tsx
const newUser: UserSummary = { oid: oid as authid, username: inviteEmail.trim() };
onUserAdded(newUser);

if (inviteFromGameOid) {
  // Add player to session immediately (skip edit mode)
  if (!session.players.includes(oid as authid)) {
    onUpdateSession({ players: [...session.players, oid] as authid[] });
  }
  // Update the game: set as winner and add as participant
  const game = games.find(g => g.oid === inviteFromGameOid);
  if (game) {
    const updatedParticipants = game.participants.includes(oid)
      ? game.participants
      : [...game.participants, oid];
    onUpdate(inviteFromGameOid, { winner: oid, participants: updatedParticipants });
  }
  setInviteFromGameOid(null);
} else {
  // Session-level invite: add to editPlayers for batch save
  setEditPlayers(prev => [...prev, oid]);
}
```

**Reset `inviteFromGameOid` on dialog close** (add to the `onClose` and Cancel handlers):
```tsx
setInviteFromGameOid(null);
```

**Pass `onInvitePlayer` to `GameRow` and `GameCardMobile`:**
```tsx
// GameRow
onInvitePlayer={() => handleGameInvite(game.oid)}

// GameCardMobile
onInvitePlayer={() => handleGameInvite(game.oid)}
```

---

## Verification

1. Start the Vite dev server (`npm run dev`)
2. Open a session with at least one game row
3. Click the Winner dropdown — confirm "+ Invite new player…" appears as the first (non-empty) option
4. Select it — confirm the invite dialog opens
5. Enter an email and submit — confirm:
   - The new player appears in the session's player chips in the header
   - The game row winner is set to the new player
   - The new player's checkbox is checked in the Players column
6. Verify the same flow works on mobile (GameCardMobile)
7. Verify the existing session-level invite flow (edit mode → Players autocomplete → "+ Invite new player…") still works unchanged
