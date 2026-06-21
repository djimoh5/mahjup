# Plan: Extra Data Feature for Intense Players

## Context

The current game record only stores hand name, category, jokers, winner flag, score, and optional notes per player. Intense players want richer per-game data — specifically which tile groups were exposed to other players, whether they pivoted from an original hand, and how the winner won. This data also enriches future AI analysis (the AI infrastructure already exists in `server/service/ai/` but isn't yet wired to game data).

---

## Scope

Three new per-player fields, all optional, surfaced via an expandable "extras" panel (mirroring the existing notes pattern):

1. **Exposed segments** — which groups in the winning hand layout were exposed to the table
2. **Pivot hand** — the original hand the player was building before switching strategies
3. **Win type** (winners only) — self-draw vs. discard, plus which player discarded

---

## Changes

### 1. `model/game.model.ts` — Add two new interfaces + extend `PlayerHand`

```ts
export interface ExposedSegment {
  index: number;    // positional index into hand's s[] array
  exposed: boolean;
}

export interface PlayerHandExtras {
  segments?: ExposedSegment[];       // exposure state per hand segment
  useAltSegments?: boolean;          // true = user chose s2[] layout
  pivotCategory?: string;
  pivotHand?: string;
  winType?: 'self' | 'discard';
  discardedBy?: string;              // userId (when winType === 'discard')
}

// Add to PlayerHand:
extras?: PlayerHandExtras;
```

No backend changes needed — MongoDB + `BaseRepository.updateObject()` uses `$set`, so nested `extras` persists automatically.

### 2. `src/data/hands.ts` — Export shared color map + helper

```ts
export const SEGMENT_COLORS: Record<SegmentColor, string> = {
  green: '#2e7d32',
  blue: '#020736',
  red: '#c62828',
};

export function getHandEntry(category: string, hand: string): HandEntry | undefined {
  return (handData[category] ?? []).find(item => item.h === hand);
}
```

Remove the duplicate `SEGMENT_COLORS` definition currently inside `src/components/HandSelect.tsx` and import it from `hands.ts` instead. Same for `ReferenceTab.tsx` if it also defines it.

### 3. `src/components/icons/Icons.tsx` — Add two icons

- **`SlidersIcon`** — the toggle button for extras (distinct from `NotesIcon`)
- **`CloseIcon`** — small × for clearing the pivot hand selection

### 4. `src/components/PlayerHandExtrasPanel.tsx` — New component (core of the feature)

Props:
```ts
interface PlayerHandExtrasPanelProps {
  playerHand: PlayerHand;
  allPlayers: PlayerHand[];          // for discardedBy select
  usersMap: Record<string, UserSummary>;
  onUpdate: (extras: PlayerHandExtras) => void;
}
```

Three visual sections separated by `<Divider>`:

**A — Exposed segments**
- Call `getHandEntry(category, hand)` to get segments
- If no `s[]` exists: show "No segment data for this hand" caption
- If `closed: true`: render chips in non-interactive concealed state + "Closed hand" label
- If `s2` also exists: small A/B `ToggleButtonGroup` to switch layouts (clearing segments on switch)
- Each segment rendered as a MUI `Chip` — click toggles `exposed`. Exposed: filled + colored. Concealed: outlined + muted.

**B — Pivot hand**
- `HandSelect` component for original hand
- Small `CloseIcon` `IconButton` to clear it when set

**C — Win type** (only rendered when `playerHand.isWinner === true`)
- Two `Button` variants: "Self-draw" | "Discard" (contained = selected, outlined = not)
- When "Discard": `Select` dropdown of other players in the game (filtered by `p.userId !== playerHand.userId`)
- Switching back to "self" clears `discardedBy`

All interactions call `onUpdate({ ...extras, ...patch })` immediately (no skipSave — same as jokers/winner toggles).

### 5. `src/components/PlayerHandRow.tsx` — Desktop integration

- Add `allPlayers: PlayerHand[]` prop
- Add local state: `const [extrasOpen, setExtrasOpen] = useState(hasExtrasData(playerHand.extras))`
- Add `SlidersIcon` `IconButton` in the actions `<td>` alongside the existing `NotesIcon`
- Render a new `<tr colSpan={5}>` after the notes row, conditionally on `extrasOpen`:

```tsx
{extrasOpen && (
  <tr style={{ background: playerHand.isWinner ? 'rgba(212,160,23,0.07)' : undefined }}>
    <td colSpan={5} style={{ padding: 0 }}>
      <PlayerHandExtrasPanel
        playerHand={playerHand}
        allPlayers={allPlayers}
        usersMap={usersMap}
        onUpdate={extras => onUpdate({ extras })}
      />
    </td>
  </tr>
)}
```

### 6. `src/components/GameRow.tsx` — Pass `allPlayers` through

Add `allPlayers={record.players}` to each `<PlayerHandRow>` instantiation.

### 7. `src/components/GameCardMobile.tsx` — Mobile integration

- Add `allPlayers: PlayerHand[]` to `MobilePlayerRow` props
- Same `extrasOpen` state + `SlidersIcon` button pattern as desktop
- Render `<PlayerHandExtrasPanel>` in a styled `Box` (not a `<tr>`) after the notes field

---

## Helper

Small pure function (can live at top of `PlayerHandRow.tsx`):
```ts
function hasExtrasData(extras?: PlayerHandExtras): boolean {
  if (!extras) return false;
  return !!(extras.segments?.length || extras.pivotHand || extras.winType);
}
```
Used to initialize `extrasOpen` as `true` when loading a record that already has extras data.

---

## Edge Cases

| Case | Handling |
|---|---|
| Hand with no `s[]` | Show "No segment data" caption; skip chip rendering |
| `closed: true` hand | Chips render non-interactive, "Closed hand" label |
| Hand has both `s` and `s2` | A/B toggle; switching clears `segments[]` |
| Non-winner player | Section C (win type) not rendered |
| Winner toggled off after winType set | Data persists in model, UI hides (no data loss) |
| Hand changed after segments set | Stale indices silently ignored (`.find()` returns undefined → defaults to `false`) |
| Existing records without `extras` | `const extras = playerHand.extras ?? {}` handles all `undefined` cases |

---

## Implementation Order

1. `model/game.model.ts` — model first, unblocks TS everywhere
2. `src/data/hands.ts` — export `SEGMENT_COLORS` + `getHandEntry`
3. `src/components/HandSelect.tsx` — remove local `SEGMENT_COLORS`, import from hands
4. `src/components/icons/Icons.tsx` — add `SlidersIcon`, `CloseIcon`
5. `src/components/PlayerHandExtrasPanel.tsx` — build panel in isolation
6. `src/components/PlayerHandRow.tsx` + `GameRow.tsx` — desktop integration
7. `src/components/GameCardMobile.tsx` — mobile integration

---

## Verification

1. `npm run dev` — start frontend; ensure backend is running (`server/monolith.app.ts`)
2. Open a game → expand a player row → click the sliders icon
3. **Exposed segments**: click segments to toggle exposed/concealed; confirm colored chip fills
4. **Pivot hand**: pick a different hand from HandSelect; confirm it saves and reloads
5. **Win type** (winner only): toggle self-draw/discard; if discard, pick a player; confirm save
6. Reload the page — verify all extras data survives the round-trip through the API
7. Verify existing games (without extras) still load and save correctly (backward compat)
8. Test mobile layout: same panel renders inside a card Box instead of a `<tr>`
