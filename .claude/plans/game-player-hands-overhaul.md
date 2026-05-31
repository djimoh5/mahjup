# Plan: Per-Player Hand Tracking Overhaul

## Context

Currently a `GameRecord` stores a single winner's hand (`category`, `hand`, `jokers`, `score`, `winner`) and a flat `participants: string[]` array. The new design tracks every player's hand within a game. Each game becomes a list of `PlayerHand` entries — one per player — with their own category, hand, jokers, and a winner toggle (exclusive, one row only). The flat fields are removed and the `participants` array is replaced by an array of objects.

No data migration — clean wipe of existing game data is acceptable.

---

## 1. Data Model — `model/game.model.ts`

Add `PlayerHand` interface, strip flat fields from `GameRecord`:

```typescript
export interface PlayerHand {
  userId: string;
  category: string;
  hand: string;
  jokers: number;
  isWinner: boolean;
  score: number;
}

export interface GameRecord {
  oid: uniqueid;
  userId?: string;
  sessionId: string;
  date: string;
  players: PlayerHand[]; // replaces: category, hand, jokers, winner, score, participants
  notes: string;
}
```

---

## 2. `src/App.tsx`

**`makeRecord`**: Remove flat fields, default `players: []`:

```typescript
function makeRecord(partial: Partial<GameRecord> = {}): GameRecord {
  return {
    oid: UniqueId(crypto.randomUUID()),
    sessionId: "",
    date: today,
    players: [],
    notes: "",
    ...partial,
  };
}
```

**`addSession`** (line 118): Remove `participants: newSession.players` — first game starts with `players: []`.

**`addRecord`** (line 140): Remove `participants: sessionPlayers` — new game starts with `players: []`.

`updateRecord` and `deleteRecord` are unchanged.

---

## 3. New Component — `src/components/PlayerHandRow.tsx`

Extract a single player's `<tr>` into its own component to keep `GameRow` readable.

**Props:**

```typescript
interface PlayerHandRowProps {
  playerHand: PlayerHand;
  isOnlyRow: boolean; // disables delete when true
  sessionPlayers: string[];
  usedUserIds: string[]; // other rows' userIds — exclude from dropdown
  users: UserSummary[];
  usersMap: Record<string, UserSummary>;
  onUpdate: (patch: Partial<PlayerHand>) => void;
  onDelete: () => void;
  onWinnerSelect: () => void; // makes this row winner, clears others
  onInvitePlayer: (cb: (userId: string) => void) => void;
}
```

**Columns (6):**

1. **Player** — single-select dropdown (same structure as the current Winner dropdown: In Session / All Players sections + `+ Invite new player…`). Selecting from "All Players" just sets `userId` directly — no `handleAddExistingPlayer` needed.
2. **Hand Category** — category select (same as current Winning Category)
3. **Hand** — hand select (filtered to selected category)
4. **Jokers** — 0–8 select
5. **Winner** — Trophy icon button. Outlined/gray when not winner; filled amber when winner. Row gets a subtle warm gold `background-color` when `isWinner`. Score chip appears inline in this cell when `isWinner`.
6. **Actions** — delete this player row (disabled/hidden when `isOnlyRow`)

**Winner + Score visual:**

```tsx
<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
  <IconButton
    size="small"
    onClick={onWinnerSelect}
    sx={{ color: playerHand.isWinner ? "#d4a017" : "text.disabled" }}
  >
    <TrophyIcon filled={playerHand.isWinner} />
  </IconButton>
  {playerHand.isWinner && playerHand.score > 0 && (
    <Chip label={`${playerHand.score} pts`} size="small" color="success" />
  )}
</Box>
```

**Row highlight:**

```tsx
<tr style={{ background: playerHand.isWinner ? 'rgba(212,160,23,0.08)' : undefined }}>
```

**Hand change** auto-resolves score from `handData`:

```typescript
function handleHandChange(hand: string) {
  const match = handData[playerHand.category]?.find((item) => item.h === hand);
  onUpdate({ hand, score: match?.v ?? 0 });
}
```

---

## 4. `src/components/GameRow.tsx` — Rewrite

Now renders a **group of rows** per game rather than a single `<tr>`.

**Structure:**

```
[PlayerHandRow for players[0]]
[PlayerHandRow for players[1]]
...
[Footer <tr>: "Add Player" btn (left) | Notes icon + Delete game icon (right)]
[Notes <tr> if open — colSpan=6]
```

**Key handlers:**

```typescript
function handlePlayerUpdate(idx: number, patch: Partial<PlayerHand>) {
  const updated = record.players.map((p, i) =>
    i === idx ? { ...p, ...patch } : p,
  );
  onUpdate({ players: updated });
}

function handleWinnerSelect(idx: number) {
  const updated = record.players.map((p, i) => ({
    ...p,
    isWinner: i === idx,
    // clear score on non-winners when winner changes
    score: i === idx ? p.score : 0,
  }));
  onUpdate({ players: updated });
}

function handleAddPlayer() {
  onUpdate({
    players: [
      ...record.players,
      {
        userId: "",
        category: "",
        hand: "",
        jokers: 0,
        isWinner: false,
        score: 0,
      },
    ],
  });
}

function handleDeletePlayer(idx: number) {
  onUpdate({ players: record.players.filter((_, i) => i !== idx) });
}
```

**`usedUserIds`** passed to each `PlayerHandRow` = other rows' `userId` values (to filter duplicates from the player dropdown).

**Note on empty game:** A game with `players: []` shows just the footer row with "Add Player" button.

---

## 5. `src/components/GameCardMobile.tsx` — Rewrite

**Collapsed summary** (read-only strip):

- Winner row (if any): `"🏆 [Name] · [Hand] · [Score] pts"`
- Other players: `"3 players"` count chip
- Edit icon button

**Edit mode** — vertical stack per player:

```
[Player select]  [Category select]  [Hand select]
[Jokers select]  [Trophy toggle → winner + score chip]  [Delete row btn]
---
[Add Player button]
[Notes field]
[Delete game btn]  [Done btn]
```

On mobile the player rows stack as cards within the game card, each with the same fields as desktop.

---

## 6. `src/components/SessionGroup.tsx`

**Table headers** — update 7 columns → 6 columns:

| Old              | New                                |
| ---------------- | ---------------------------------- |
| Winning Category | Hand Category                      |
| Winning Hand     | Hand                               |
| Jokers           | Jokers                             |
| Winner           | Winner                             |
| Points           | _(removed — inline on winner row)_ |
| Players          | _(removed — each player is a row)_ |
| _(actions)_      | _(actions)_                        |

**Invite flow** — replace `inviteFromGameOid: string | null` with `pendingInviteCallback: ((userId: string) => void) | null`:

```typescript
const [pendingInviteCallback, setPendingInviteCallback] = useState<
  ((userId: string) => void) | null
>(null);

function handleInviteOpen(cb: (userId: string) => void) {
  setPendingInviteCallback(() => cb);
  setInviteOpen(true);
}

// In handleInviteConfirm, after successful invite:
onUserAdded(newUser);
if (pendingInviteCallback) {
  pendingInviteCallback(oid);
  setPendingInviteCallback(null);
}
```

**`onInvitePlayer` prop to GameRow/GameCardMobile** changes signature:

```typescript
onInvitePlayer: (cb: (userId: string) => void) => void
// Called as: onInvitePlayer={() => handleInviteOpen(...)}
// Actually passed as: onInvitePlayer={handleInviteOpen}
```

**`onAddExistingPlayer` callback** — removed entirely. Not needed since the player dropdown in each row handles all users directly.

**GameRow/GameCardMobile call sites** — remove `onAddExistingPlayer` prop, pass updated `onInvitePlayer`.

---

## 7. `src/components/SummaryTab.tsx`

Update to read from the new model:

```typescript
// Old:
const valid = records.filter(d => d.category);
const wins = valid.filter(d => d.winner === currentUserOid);
const points = wins.reduce((acc, d) => acc + d.score, 0);
counts[d.category] = ...

// New:
const valid = records.filter(d => d.players?.length > 0);
const wins = valid.filter(d => d.players.some(p => p.isWinner && p.userId === currentUserOid));
const points = wins.reduce((acc, d) => {
  const winner = d.players.find(p => p.isWinner && p.userId === currentUserOid);
  return acc + (winner?.score ?? 0);
}, 0);

// Category distribution — count each player's category (not just winner's):
valid.forEach(d => {
  d.players.forEach(p => {
    if (p.category) counts[p.category] = (counts[p.category] ?? 0) + 1;
  });
});
```

---

## 8. `server/repository/game.repository.ts`

Update `getByParticipant` — `participants` field no longer exists:

```typescript
// Old:
getByParticipant(userId: string): Promise<GameRecord[]> {
    return this.context.find({ participants: userId });
}

// New:
getByParticipant(userId: string): Promise<GameRecord[]> {
    return this.context.find({ 'players.userId': userId });
}
```

---

## Critical Files

| File                                                                         | Change                                                                 |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [model/game.model.ts](model/game.model.ts)                                   | Add `PlayerHand`, rewrite `GameRecord`                                 |
| [src/App.tsx](src/App.tsx)                                                   | Update `makeRecord`, `addSession`, `addRecord`                         |
| [src/components/PlayerHandRow.tsx](src/components/PlayerHandRow.tsx)         | **New file** — single player `<tr>`                                    |
| [src/components/GameRow.tsx](src/components/GameRow.tsx)                     | Rewrite — render group of `PlayerHandRow` + footer                     |
| [src/components/GameCardMobile.tsx](src/components/GameCardMobile.tsx)       | Rewrite — vertical player stack                                        |
| [src/components/SessionGroup.tsx](src/components/SessionGroup.tsx)           | New headers, new invite callback pattern, remove `onAddExistingPlayer` |
| [src/components/SummaryTab.tsx](src/components/SummaryTab.tsx)               | Adapt to `players[]`                                                   |
| [server/repository/game.repository.ts](server/repository/game.repository.ts) | Update `getByParticipant` query                                        |

---

## Verification

1. Create a new game → shows one "Add Player" footer row only; clicking "Add Player" adds a player row.
2. Fill in a player row — player dropdown shows In Session / All Players / Invite sections; selecting a hand auto-populates score.
3. Click trophy icon on a row → that row highlights gold, score chip appears, other rows lose winner status.
4. Trying to select winner on two rows → only the latest clicked is winner (previous deselects).
5. Delete a player row → row removed; if only one row, delete is disabled.
6. Invite player from a row's dropdown → invite dialog opens, new user appears as that row's player after confirmation.
7. Summary tab shows correct win rate and category distribution.
8. Mobile: collapsed card shows winner name + hand + score; edit mode shows vertical player stack.
9. Backend: a user added as a `players.userId` in any game will see that session in their session list.
