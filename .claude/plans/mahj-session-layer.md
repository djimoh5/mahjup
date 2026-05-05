# Plan: Add Session Layer to MahjUp Tracker

## Context
Games in the tracker are currently standalone records with a free-text `opponents` field. The feature adds a **MahjSession** as a parent container — a scheduled gathering with a date/time and a player roster. All new games must belong to a session. Games inherit available players from their session and let you checkbox-select who actually played. Existing data will be cleared (still in testing); no migration needed.

---

## Data Model Changes

### New: `model/mahj-session.model.ts`
```typescript
export interface MahjSession {
    oid: string;
    userId?: string;          // stamped by backend
    dateTime: string;         // YYYY-MM-DDTHH:mm
    title?: string;
    players: string[];        // all expected players
    notes?: string;
}
```

### Modified: `model/game.model.ts`
- Replace `opponents: string` with `participants: string[]`
- Add `sessionId: string` (required)

```typescript
export interface GameRecord {
    oid: string;
    userId?: string;
    sessionId: string;
    date: string;
    category: string;
    hand: string;
    wl: 'Win' | 'Loss';
    score: number;
    participants: string[];   // subset of session players who played
    notes: string;
}
```

---

## Backend Changes

All additions follow the existing `game.*` file patterns exactly.

| File | Action | Notes |
|------|--------|-------|
| `model/mahj-session.model.ts` | **Create** | Interface above |
| `model/game.model.ts` | **Modify** | Add `sessionId`, replace `opponents` |
| `server/respository/mahj-session.repository.ts` | **Create** | Mirror `game.repository.ts`; MongoDB collection `mahj_sessions`; add `getByUser(userId)` |
| `server/service/mahj-session.service.ts` | **Create** | Mirror `game.service.ts`; `remove()` must also call `gameRepository.removeBySession(oid)` |
| `server/respository/game.repository.ts` | **Modify** | Add `removeBySession(sessionId)` method: `this.context.deleteMany({ sessionId })` |
| `server/controller/api.controller.ts` | **Modify** | Inject `MahjSessionService`, add 3 endpoints below |

New endpoints to add to `APIController`:
```typescript
@Get('mahj-session/list')
async getSessions(req, res) { res.send(await this.mahjSessionService.getByUser(req.session.user.oid)); }

@Post('mahj-session')
async saveSession(req, res) { res.send(await this.mahjSessionService.save(req.body, req.session.user.oid)); }

@Delete('mahj-session/:oid')
async deleteSession(req, res) { res.send(await this.mahjSessionService.remove(req.params.oid, req.session.user.oid)); }
```

> `@Bootstrap()` on the new repo/service automatically registers them with the DI injector — no changes to `bootstrap.ts`.

---

## Frontend Changes

| File | Action | Notes |
|------|--------|-------|
| `src/services/mahj-session.service.ts` | **Create** | Mirror `game.service.ts`; endpoints `/mahj-session/list`, `/mahj-session`, `/mahj-session/:oid` |
| `src/App.tsx` | **Modify** | Add `sessions` state + CRUD handlers; update `addRecord` signature; fetch sessions on user load |
| `src/components/TrackerTab.tsx` | **Modify** | Replace "Add Game Entry" with "New Session"; render `SessionGroup` per session |
| `src/components/SessionGroup.tsx` | **Create** | Collapsible session card (see spec below) |
| `src/components/GameRow.tsx` | **Modify** | Accept `sessionPlayers: string[]`; replace Opponents text input with checkboxes |
| `src/components/GameCardMobile.tsx` | **Modify** | Same as `GameRow` |
| `src/styles.css` | **Modify** | Add session group, player entry, and checkbox styles |

### `App.tsx` state additions
```typescript
const [sessions, setSessions] = useState<MahjSession[]>([]);

// On user load, also fetch: sessionService.getAll() → setSessions(...)
// addSession() → create + save, prepend to sessions state
// updateSession(oid, patch) → patch + save
// deleteSession(oid) → remove session + all games in it (one API call)
// addRecord(sessionId: string, sessionPlayers: string[]) → makeRecord({ sessionId, participants: sessionPlayers, date from session })
```

### `TrackerTab` props change
```typescript
interface TrackerTabProps {
  sessions: MahjSession[];
  records: GameRecord[];
  onAddSession: () => void;
  onUpdateSession: (oid: string, patch: Partial<MahjSession>) => void;
  onDeleteSession: (oid: string) => void;
  onAddGame: (sessionId: string, sessionPlayers: string[]) => void;
  onUpdate: (id: string, patch: Partial<GameRecord>, skipSave?: boolean) => void;
  onDelete: (id: string) => void;
}
```

### `SessionGroup` component spec
- Props: `session`, `games: GameRecord[]`, callbacks for all CRUD
- Collapsed/expanded toggle (expanded by default)
- **Session header row**: formatted date/time · title · player tag pills · "Add Game" button · edit (pencil) button · delete button
- **Edit mode**: inline — title input, datetime picker, multi-player entry (text input + "Add player" + "×" per player)
- **Games area**: same desktop-table / mobile-card split as current TrackerTab (uses `useIsMobile()`)
- On desktop: renders games as `<GameRow>` rows in an inner `<table>`; passes `sessionPlayers={session.players}`
- On mobile: renders games as `<GameCardMobile>` cards; same prop

### `GameRow` / `GameCardMobile` changes
- Remove `opponents` text input column/field
- Add `sessionPlayers: string[]` prop
- New "Players" UI: horizontal checkbox list (`<label><input type="checkbox"> Name</label>` per player)
- Default all checked (initialized from `record.participants`, fallback to all session players)
- On change: call `onUpdate({ participants: [...checked] })`

---

## New CSS Classes Needed (`src/styles.css`)
- `.session-group` — card-style container with border, border-radius, margin-bottom
- `.session-header` — flex row; left: date/time + title + player pills; right: action buttons
- `.session-player-pill` — small rounded tag showing a player name
- `.player-entry-list` — vertical stack of text inputs for session player entry
- `.player-entry-row` — single player input + remove "×" button
- `.participant-checks` — flex wrap of checkbox labels for game participant selection

---

## Verification
1. `npm run dev` → navigate to Tracker tab
2. Click **New Session** → session form expands; add title, datetime, 3–4 players → Save
3. Session group appears collapsed/expanded; player pills visible in header
4. Click **Add Game** inside session → game row/card appears with all player checkboxes checked
5. Uncheck one player → save → verify `participants` excludes that player
6. Edit session (pencil) → change title, add/remove a player → Save
7. Delete session → session and all its games disappear
8. `npm run lint` — no TypeScript errors
