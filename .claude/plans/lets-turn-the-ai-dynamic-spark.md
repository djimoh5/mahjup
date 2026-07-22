# AI Summary → Standalone Filterable Tab

## Context

The "AI Summary" (backend name: "game analysis") feature currently lives as a card inside the **Tracker** tab (`AiSummary.tsx`, mounted at `TrackerTab.tsx:101`). It always analyzes a user's _entire_ game history with no filtering, and storage is a single upserted Mongo document per user (`game_analysis` collection, keyed by `userId`) — meaning every regeneration destroys the previous result.

The user wants:

1. AI Summary promoted to its own top-level tab.
2. Filtering of what data the AI sees: by time range (past week/month/etc.) and by a set of people (games are included if the selected people ALL appear in them, regardless of any other participants also in that game).
3. Generating a summary under a _different_ filter combination must not delete/replace a summary generated under other filters — only regenerating with the _same_ filters replaces that filter's summary.

This requires the storage model to move from "one analysis per user" to "one analysis per (user, filter combination)", plus new filter UI, plus a couple of latent correctness fixes that the filtering work exposes (see below).

## Shared model changes — `model/game-analysis.model.ts`

Add filter types and pure helpers used identically by both frontend and backend (avoids client/server drift):

```ts
export interface GameAnalysisFilters {
  timeRange: "all" | "week" | "month" | "months3" | "year";
  playerIds: string[]; // other players for whom a game is included if ANY of them appear in it
}

export interface GameAnalysis {
  oid?: uniqueid;
  userId: authid;
  filters: GameAnalysisFilters;
  filtersKey: string;
  gameIds: uniqueid[];
  content: string;
  _tsu?: number;
}

export const DEFAULT_GAME_ANALYSIS_FILTERS: GameAnalysisFilters = {
  timeRange: "all",
  playerIds: [],
};

export function normalizeGameAnalysisFilters(
  filters?: Partial<GameAnalysisFilters>,
): GameAnalysisFilters;
// sorts + dedupes playerIds, defaults timeRange to 'all' — MUST run before hashing or comparing

export function gameAnalysisFiltersKey(filters: GameAnalysisFilters): string;
// deterministic string, e.g. `${timeRange}|${playerIds.join(',')}` — identity check for "same filters"

export function filterRecordsForAnalysis(
  records: GameRecord[],
  sessions: MahjSession[],
  userId: string,
  filters: GameAnalysisFilters,
): GameRecord[];
// 1. keep only records where the analyzed userId actually appears in players
//    (GameService.getByUser returns session-mates' records too — see Correctness fix below)
// 2. time cutoff is based on the record's SESSION date (session.dateTime), not GameRecord.date —
//    build a sessionMap by oid, cutoff computed as a YYYY-MM-DD string via UTC day arithmetic,
//    compare lexicographically against session.dateTime.split('T')[0] (fall back to record.date
//    only if the session can't be found). Do NOT parse into Date/epoch — avoids local-midnight
//    off-by-one.
// 3. player filter is OR, not AND: keep records where playerIds.length === 0 ||
//    filters.playerIds.some(pid => record.players.some(p => p.userId === pid))
//    i.e. show the game if ANY selected player appears in it (regardless of other participants)
```

## Backend changes

**`server/repository/game-analysis.repository.ts`**

- Replace `getByUser` with:
  - `getAllByUser(userId)` → `this.context.find({ userId }, null, { sort: { _tsu: SortOrder.Descending } })` (follow `ai-log.repository.ts:19` pattern — `find()` has no implicit recency order otherwise).
  - `getByUserAndFilters(userId, filtersKey)` → `findOne({ userId, filtersKey })`, EXCEPT when `filtersKey` equals the default filters' key, query `{ userId, filtersKey: { $in: [filtersKey, null] } }` so pre-existing legacy documents (saved before this change, which have no `filtersKey` field) are picked up and self-heal in place on next save — no migration script needed.

**`server/service/game-analysis.service.ts`**

- `analyze(userId, username, rawFilters: Partial<GameAnalysisFilters>)`:
  - Normalize filters, fetch raw records/sessions as today.
  - Run `filterRecordsForAnalysis(records, sessions, userId, filters)` — this also fixes a latent bug where session-mates' hands (not involving the analyzed user) could leak into the text blob, since `GameService.getByUser` merges session-based and participant-based records.
  - Branch the "empty" message on two distinct cases: `records.length === 0` ("no games played yet") vs. `filteredRecords.length === 0` ("no games match these filters") — both still persisted under their own `filtersKey`.
  - Build `nameMap`/prompt text from `filteredRecords`, not raw `records`.
  - Compute `filtersKey = gameAnalysisFiltersKey(filters)`.
  - `_upsert(userId, filters, filtersKey, gameIds, content)`: look up existing via `getByUserAndFilters(userId, filtersKey)` to decide whether to reuse its `oid` (replace) or mint a new one (new doc) — this is the entire mechanism implementing "same filters replace, different filters coexist."
- Rename `getByUser` → `getAllByUser(userId)`, returning `ApiResponse<GameAnalysis[]>`.

**`server/controller/api.controller.ts`**

- `@Get('game/summary')` → `@Post('game/summary')`, reads `req.body.filters`, calls `analyze(userId, username, filters)`, and now responds with the **full `GameAnalysis` object** (not just `.content`) so the frontend gets the updated record in one round trip.
- `@Get('game/analysis')` → calls `getAllByUser`, returns the array.

## Frontend changes

**`src/services/game.service.ts`**

- `getSummary(filters: GameAnalysisFilters)` → `POST /game/summary` with `{ filters }`, returns `{ analysis: GameAnalysis | null }`.
- Rename `getAnalysis()` → `getAnalyses()` → `GET /game/analysis`, returns `{ analyses: GameAnalysis[] }`.

**`src/App.tsx`**

- Add `'aiSummary'` to the `Tab` union (line 23) and `TAB_PATHS`/`PATH_TO_TAB` (e.g. path `/ai-summary`).
- Replace `analysis` state with `analyses: GameAnalysis[]`; update the mount effect and `refreshData()` to call `gameService.getAnalyses()`.
- `handleAnalysisUpdated(updated)`: find by `oid` in `analyses`, replace if present else append (works because the backend always returns a full record with a stable `oid` per filter combo).
- Remove `analysis`/`lastModifiedAt`/`onAnalysisUpdated` props from `TrackerTab` (they move to the new tab); keep `lastModifiedAt` state itself (still bumped on every mutation) and pass it to the new tab instead.
- Add a new `<Box sx={{ display: activeTab !== 'aiSummary' ? 'none' : 'block' }}>` panel rendering `AiSummaryTab`, passed `analyses`, `records`, `sessions`, `users`, `usersMap`, `currentUserOid={user!.oid}`, `lastModifiedAt`, `onAnalysisUpdated={handleAnalysisUpdated}`.

**`src/components/TrackerTab.tsx`** — remove the `<AiSummary .../>` mount (line 101), its import, and the now-unused `analysis`/`lastModifiedAt`/`onAnalysisUpdated` props.

**`src/components/Header.tsx`** — add `<Tab label="AI Insights" value="aiSummary" />` to the `<Tabs>` (avoiding label collision with the existing "Summary" stats tab).

**New `src/components/AiSummaryTab.tsx`** (refactor of `AiSummary.tsx`, same visual language — reuse `cardSx`, the accordion, and the loading-wave animation):

- Local filter state: `timeRange` (`<Select>`: All Time / Past Week / Past Month / Past 3 Months / Past Year) and `playerIds` (`<Select multiple>` with checkboxes). Build the selectable player list from all distinct player oids ever seen across the full (unfiltered) `records` prop, excluding `currentUserOid`, resolved to display names via `usersMap` — population is independent of the time-range selection so switching time range never hides an already-picked player.
- Compute `filtersKey = gameAnalysisFiltersKey(normalizeGameAnalysisFilters({ timeRange, playerIds }))` and look up `analyses.find(a => a.filtersKey === filtersKey)` to get the `currentAnalysis` (idle if none, done if present).
- Staleness check (same shape as today's, scoped to the current filter): compare `lastModifiedAt` and `_tsu` of `filterRecordsForAnalysis(records, sessions, currentUserOid, filters)` / relevant sessions against `currentAnalysis._tsu`.
- "Generate"/"Update Analysis" button calls `gameService.getSummary(filters)` then `onAnalysisUpdated(analysis)`.
- A "Previous Summaries" section listing every entry in `analyses` other than `currentAnalysis`, each labeled by its filters (e.g. "Past month · You & Jane Doe") and timestamp; clicking one sets `timeRange`/`playerIds` to match it, which naturally brings it into view as `currentAnalysis` via the lookup above (no separate view-state needed).

## Verification

1. `cd server && npx tsc -p tsconfig.json` and `npm run build` (root) — confirm both compile with the model/interface changes.
2. Run the app (`npm run dev` + backend), log in, go to the new "AI Insights" tab:
   - Generate a summary with default filters (All Time, no players) — confirm it saves and displays.
   - Change filters (e.g. Past Week) and generate again — confirm the "All Time" summary still appears in Summaries (not deleted), and the new one is a separate entry.
   - Regenerate under the exact same filters again — confirm it replaces (same entry updates, no duplicate).
   - Pick a player filter with someone who has no shared games in range — confirm the "no games match these filters" message appears distinctly from "no games played yet."
3. Confirm the Tracker tab no longer shows the AI Summary card, and the existing "Summary" stats tab is unaffected.
