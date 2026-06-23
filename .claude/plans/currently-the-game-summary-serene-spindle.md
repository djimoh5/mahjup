# Plan: Extract Game Summary into GameAnalysisService with Persistence

## Context

The AI-powered game analysis logic currently lives directly in `APIController.summarizeGames()` (api.controller.ts:218-279). This violates separation of concerns — business logic belongs in a service. Additionally, every click of "Analyze My Games" re-runs the expensive AI call with no persistence. The goal is to:

1. Move all AI analysis logic into a new `GameAnalysisService`
2. Persist results to MongoDB via a new `GameAnalysisRepository` (one record per user, audited with the game IDs that were included)
3. Add a `GET /game/analysis` endpoint so the frontend can load the last saved analysis on mount
4. On the frontend, show a "Refresh Analysis" button when any game or session has been updated more recently than the saved analysis (`_tsu` comparison)

---

## Files to Create

### `model/game-analysis.model.ts`
```typescript
import { authid, uniqueid } from './id.model';

export interface GameAnalysis {
    oid?: uniqueid;
    userId: authid;
    gameIds: uniqueid[];   // audit: which game records were included
    content: string;       // HTML analysis fragment
    _tsu?: number;         // auto-set by DatabaseContext on every save
}
```

### `server/repository/game-analysis.repository.ts`
- Collection name: `game_analysis`
- Decorators: `@Injectable()` + `@Bootstrap()`
- Extends `BaseRepository`
- Methods:
  - `getByUser(userId: string): Promise<GameAnalysis>` → `context.findOne({ userId })`
  - `save(analysis: GameAnalysis): Promise<GameAnalysis>` → `super.updateObject(analysis)`

### `server/service/game-analysis.service.ts`
- Decorators: `@Injectable()` + `@Bootstrap()`
- Extends `BaseService`
- Constructor injects: `AppService`, `AIService`, `AuthService`, `GameService`, `GameAnalysisRepository`
- **`analyze(userId: authid, username: string): Promise<ApiResponse<GameAnalysis>>`**
  - Contains all logic currently in `APIController.summarizeGames()` (game fetch, name map, prompt build, AI call)
  - After getting the AI result, looks up `gameAnalysisRepository.getByUser(userId)` to get existing oid (or generates a new one via `crypto.randomUUID()`)
  - Saves `GameAnalysis` object with `oid`, `userId`, `gameIds` (all record oids), `content`
  - Returns the saved analysis
- **`getByUser(userId: string): Promise<ApiResponse<GameAnalysis | null>>`**
  - Returns `gameAnalysisRepository.getByUser(userId)` (may be null/undefined)

---

## Files to Modify

### `server/controller/api.controller.ts`
- Replace `AIService` import + injection with `GameAnalysisService`
- **`summarizeGames` (GET /game/summary):** Delegate to `gameAnalysisService.analyze(userId, req.session.user.username)`. Return `new ApiResponse(result.success, result.data?.content ?? '')` to keep the existing string response contract for `getSummary()`.
- **New route `GET /game/analysis`:** Call `gameAnalysisService.getByUser(userId)`. Returns the full `GameAnalysis` object (including `_tsu`).

### `model/game.model.ts`
- Add `_tsu?: number` to `GameRecord` (MongoDB sets this; it's already returned in API responses)

### `model/mahj-session.model.ts`
- Add `_tsu?: number` to `MahjSession` (same reason)

### `src/services/game.service.ts`
- Add import for `GameAnalysis` from `../../model/game-analysis.model`
- Add **`getAnalysis(): Promise<{ analysis: GameAnalysis | null; error?: string }>`** → GET `/game/analysis`

### `src/App.tsx`
- Import `GameAnalysis` type
- Add `analysis` state: `useState<GameAnalysis | null>(null)`
- In the `Promise.all` on mount (line 94) and in `refreshData()`, add `gameService.getAnalysis()` as a fourth call; update `setAnalysis(fetchedAnalysis)`
- Add `handleAnalysisUpdated(a: GameAnalysis)` → `setAnalysis(a)`
- Pass `analysis`, `onAnalysisUpdated={handleAnalysisUpdated}` as new props to `<TrackerTab>`

### `src/components/TrackerTab.tsx`
- Add to `TrackerTabProps`:
  - `analysis: GameAnalysis | null`
  - `onAnalysisUpdated: (analysis: GameAnalysis) => void`
- Pass these through to `<AiSummary analysis={analysis} records={records} sessions={sessions} onAnalysisUpdated={onAnalysisUpdated} />`

### `src/components/AiSummary.tsx`
- Add props interface:
  ```typescript
  interface AiSummaryProps {
    analysis: GameAnalysis | null;
    records: GameRecord[];
    sessions: MahjSession[];
    onAnalysisUpdated: (analysis: GameAnalysis) => void;
  }
  ```
- Initialize `status` based on prop: `useState<'idle'|'loading'|'done'>(() => analysis ? 'done' : 'idle')`
- Initialize `summary` from prop: `useState<string | null>(() => analysis?.content ?? null)`
- Compute staleness:
  ```typescript
  const analysisTsu = analysis?._tsu ?? 0;
  const isStale = analysisTsu > 0 && (
    records.some(r => (r._tsu ?? 0) > analysisTsu) ||
    sessions.some(s => (s._tsu ?? 0) > analysisTsu)
  );
  ```
- After `handleAnalyze()` resolves `getSummary()`:
  - Fetch fresh analysis via `gameService.getAnalysis()` and call `onAnalysisUpdated(freshAnalysis)`
  - Update local `summary` state with the content
- In the 'done' accordion view, when `isStale` is true, render a "Refresh Analysis" button alongside the accordion header that triggers `handleAnalyze()`
- Note: `analysis` prop changes (e.g., on initial load after a fresh analysis) should sync local state — add `useEffect(() => { if (analysis) { setSummary(analysis.content); setStatus('done'); } }, [analysis])`

---

## Verification

1. Start the backend monolith and frontend dev server
2. Log in and navigate to the Tracker tab
3. On first load with no prior analysis: "Analyze My Games" button appears; clicking it calls `/game/summary`, runs AI, saves to DB, displays result
4. Reload the page: analysis loads from `/game/analysis` immediately without re-running AI
5. Add or update a game record, then navigate to Tracker tab: "Refresh Analysis" button appears (game's `_tsu` > analysis's `_tsu`)
6. Click Refresh: re-runs analysis, updates DB, button disappears
7. Confirm `game_analysis` collection in MongoDB has one document per user with `gameIds`, `content`, and `_tsu` fields
