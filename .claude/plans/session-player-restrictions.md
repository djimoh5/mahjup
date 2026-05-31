# Plan: Simplify Session Creation & Open Game Participants

## Context

Sessions were designed with a `players` field to restrict who can participate in games within that session. However:

- The player restriction should be **optional** — if no players are set, any user can be added to a game.
- Game participants should **never propagate back up** to session players. Session players are only a restriction mechanism, not a record of attendance.
- Because game participation is now independent of session.players, the backend must also discover sessions via game participation (not just via session.players membership).

## Changes

---

### Frontend

#### 1. `src/App.tsx` — line 117

Stop defaulting the current user into session players:

```ts
// Before:
const newSession = makeSession({ players: [user!.oid] });

// After:
const newSession = makeSession();
```

The first game (`participants: newSession.players`) will now start with empty participants — users select them per game.

---

#### 2. `src/components/SessionGroup.tsx`

**A. Remove Players UI from edit form (lines 283–331)**

Delete the entire `<Box>` block containing the Players `Autocomplete`. Keep `editPlayers` state and `selectedUsers` — needed if the players UI is restored in the future.

`handleSave` already saves `players: editPlayers`, so existing sessions with players are preserved on save.

**B. Simplify `handleAddExistingPlayer` (lines 108–119)**

Remove the session.players mutation entirely. Game events never touch session.players:

```ts
function handleAddExistingPlayer(gameOid: string, playerOid: string) {
  // No longer propagates to session.players
  const game = games.find(g => g.oid === gameOid);
  if (game) {
    const updatedParticipants = game.participants.includes(playerOid)
      ? game.participants
      : [...game.participants, playerOid];
    onUpdate(gameOid, { winner: playerOid, participants: updatedParticipants });
  }
}
```

**C. Simplify `handleInviteConfirm` (lines 133–143)**

When inviting from a game, remove the session.players update. Only update the game record:

```ts
// Remove these lines entirely from the inviteFromGameOid branch:
if (!session.players.includes(oid as authid)) {
  onUpdateSession({ players: [...session.players, oid] as authid[] });
}
```

---

#### 3. `src/components/GameRow.tsx` — Participants section (lines 106–114)

When `sessionPlayers` is empty, fall back to showing ALL users as participant checkboxes:

```tsx
// Before: sessionPlayers.map(...)
// After:
{(sessionPlayers.length > 0 ? sessionPlayers : users.map(u => u.oid)).map(player => (
  <FormControlLabel ... />
))}
```

Winner dropdown already handles the empty-sessionPlayers case gracefully (the "In Session" subheader is suppressed by its `sessionSorted.length > 0` guard, and `otherUsersSorted` = all users).

---

#### 4. `src/components/GameCardMobile.tsx` — Participants section (lines 124–134)

Remove the `sessionPlayers.length > 0` guard and show all users when session has no players:

```tsx
// Before: {sessionPlayers.length > 0 && <Box>...</Box>}
// After:
<Box>
  <Typography variant="caption" color="text.secondary">Players</Typography>
  <FormGroup row>
    {(sessionPlayers.length > 0 ? sessionPlayers : users.map(u => u.oid)).map(player => (...))}
  </FormGroup>
</Box>
```

---

### Backend

#### 5. `server/repository/game.repository.ts`

Add a method to find all games where a user is a participant:

```ts
getByParticipant(userId: string): Promise<GameRecord[]> {
    return this.context.find({ participants: userId });
}
```

---

#### 6. `server/repository/mahj-session.repository.ts`

Add a method to look up sessions by a list of OIDs (needed for the participation-based lookup):

```ts
getByOids(oids: string[]): Promise<MahjSession[]> {
    return this.context.find({ oid: { $in: oids } });
}
```

---

#### 7. `server/service/mahj-session.service.ts` — `getByUser`

Expand to include sessions the user can reach via game participation:

```ts
async getByUser(userId: string): Promise<ApiResponse<MahjSession[]>> {
    const sessionsByMembership = await this.mahjSessionRepository.getByUser(userId);
    const gamesByParticipation = await this.gameRepository.getByParticipant(userId);
    const participantSessionIds = [...new Set(gamesByParticipation.map(g => g.sessionId))];
    const membershipOids = new Set(sessionsByMembership.map(s => s.oid));
    const missingIds = participantSessionIds.filter(id => !membershipOids.has(id));
    const sessionsByParticipation = missingIds.length > 0
        ? await this.mahjSessionRepository.getByOids(missingIds)
        : [];
    return new ApiResponse(true, [...sessionsByMembership, ...sessionsByParticipation]);
}
```

---

#### 8. `server/service/game.service.ts` — `getByUser`

Expand to include games where the user is a participant (not just games in sessions they're a member of):

```ts
async getByUser(userId: string): Promise<ApiResponse<GameRecord[]>> {
    const sessions = await this.mahjSessionRepository.getByUser(userId);
    const recordsBySessions = await this.gameRepository.getBySessions(sessions.map(s => s.oid));
    const recordsByParticipation = await this.gameRepository.getByParticipant(userId);
    const existingOids = new Set(recordsBySessions.map(r => r.oid));
    const merged = [...recordsBySessions];
    for (const r of recordsByParticipation) {
        if (!existingOids.has(r.oid)) merged.push(r);
    }
    return new ApiResponse(true, merged);
}
```

---

## Critical Files

| File | Change |
|------|--------|
| [src/App.tsx](src/App.tsx) | Remove `players: [user!.oid]` from `makeSession` call |
| [src/components/SessionGroup.tsx](src/components/SessionGroup.tsx) | Remove Players Autocomplete UI; remove all session.players mutation from game-level handlers |
| [src/components/GameRow.tsx](src/components/GameRow.tsx) | Show all users as participant pool when sessionPlayers is empty |
| [src/components/GameCardMobile.tsx](src/components/GameCardMobile.tsx) | Same as GameRow |
| [server/repository/game.repository.ts](server/repository/game.repository.ts) | Add `getByParticipant` |
| [server/repository/mahj-session.repository.ts](server/repository/mahj-session.repository.ts) | Add `getByOids` |
| [server/service/mahj-session.service.ts](server/service/mahj-session.service.ts) | Expand `getByUser` to include participation-based sessions |
| [server/service/game.service.ts](server/service/game.service.ts) | Expand `getByUser` to include participation-based games |

## Verification

1. Create a new session → edit form shows only Title and Date (no Players field).
2. Add a game → participants section shows ALL known users as checkboxes.
3. Select a winner from the All Players list → winner set + added to participants, session.players stays `[]`.
4. Invite a new player from a game → user appears in game participants/winner only; session.players unchanged.
5. Log in as a user who was added as a game participant but is not the session creator → they should see that session in their session list.
6. (Regression) Existing sessions that already have players in the DB → game participant pool should still be restricted to those players.
7. (Regression) Mobile game card shows all users as participant checkboxes when session has no players.
