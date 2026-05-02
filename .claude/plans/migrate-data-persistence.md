# Plan: Migrate Game Data Persistence to MongoDB

## Context

Game records are currently stored in `localStorage` under the key `mahjongData`. The backend already has a full auth system with MongoDB. This plan wires up the same DB pipeline for game record CRUD, scoped per authenticated user. The `HandEntry` reference data (`src/data/hands.ts`) is static read-only data — it stays in the frontend bundle and does not need database persistence.

## Auth Model

Routes without `@NoAuth()` in `api.controller.ts` automatically require a valid session token — the middleware in `base.controller.ts` line 240 checks `req.session.user.token`. Game endpoints will have no `@NoAuth()` decorator, making them session-protected by default. The `@Auth(priv)` privilege decorator is for role-based checks and is not needed here. The authenticated user's oid is available as `req.session.user.oid` and must be stamped onto each game record by the service before persisting.

---

## ID Strategy

The frontend assigns `id = crypto.randomUUID()` to every `GameRecord`. The backend MongoDB model uses `oid` as its primary key. The mapping is transparent:

- **Create:** frontend generates `id`; service sends it as `oid`; backend stores it — UUIDs match.
- **Fetch:** backend returns `oid`; frontend service maps `oid → id` before handing to components.
- **Update/Delete:** same UUID flows both directions.

---

## Backend — Files to Create

### 1. `model/game.model.ts`

```typescript
import { Common } from '../utility/common';
import { uniqueid, UniqueId } from './id.model';

export class GameRecord {
    oid: uniqueid;
    userId: string;    // scopes records per user — stamped by service, never trusted from client
    date: string;      // YYYY-MM-DD
    category: string;
    hand: string;
    wl: 'Win' | 'Loss';
    score: number;
    opponents: string;
    notes: string;

    constructor(userId: string) {
        this.oid = UniqueId(Common.uniqueId());
        this.userId = userId;
    }
}
```

### 2. `core/respository/game.repository.ts`

Collection: `game_records`. Decorators: `@Injectable()` `@Bootstrap()`

Methods:
- `getByUser(userId: string): Promise<GameRecord[]>` — `context.find({ userId })`
- `save(record: GameRecord): Promise<GameRecord>` — `super.updateObject(record)` (upsert by `oid`)
- `remove(oid: string): Promise<boolean>` — `super.removeObject(oid)`

### 3. `core/service/game.service.ts`

Extends `BaseService`. Decorators: `@Injectable()` `@Bootstrap()`.  
Constructor: `(protected appService: AppService, private gameRepository: GameRepository)`.

Methods:
- `getByUser(userId: string): Promise<ApiResponse<GameRecord[]>>`
- `save(record: GameRecord, userId: string): Promise<ApiResponse<GameRecord>>` — stamps `record.userId = userId` before calling `gameRepository.save(record)`
- `remove(oid: string): Promise<ApiResponse<null>>`

The service always overwrites `userId` from the parameter so client-supplied values cannot spoof ownership.

---

## Backend — Files to Modify

### 4. `core/controller/api.controller.ts`

**Add `GameService` to the constructor** (second injected dependency):
```typescript
constructor(private authService: AuthService, private gameService: GameService)
```

**Add three new methods** with no `@NoAuth()` so they are session-protected:

```typescript
@Get('game/records')
async getRecords(req: Request, res: Response) {
    const data = await this.gameService.getByUser(req.session.user.oid);
    res.send(data);
}

@Post('game/record')
async saveRecord(req: Request, res: Response) {
    const data = await this.gameService.save(req.body, req.session.user.oid);
    res.send(data);
}

@Delete('game/record/:oid')
async deleteRecord(req: Request, res: Response) {
    const data = await this.gameService.remove(req.params.oid);
    res.send(data);
}
```

No changes to router.ts or any other file are required.

---

## Frontend — Files to Create

### 5. `src/services/game.service.ts`

Extends `BaseService`. Handles `oid ↔ id` mapping internally.

```typescript
interface BackendRecord {
    oid: string; userId: string; date: string; category: string;
    hand: string; wl: 'Win' | 'Loss'; score: number; opponents: string; notes: string;
}

// Maps backend oid → frontend id; strips userId (not needed in UI)
function toFrontend(r: BackendRecord): GameRecord { ... }

// Maps frontend id → backend oid; userId is set by the backend from the session
function toBackend(r: GameRecord): Omit<BackendRecord, 'userId'> { ... }

export class GameService extends BaseService {
    async getAll(): Promise<{ records: GameRecord[]; error?: string }>
        // GET /game/records → map each item toFrontend

    async save(record: GameRecord): Promise<{ record: GameRecord | null; error?: string }>
        // POST /game/record with toBackend(record); map response toFrontend

    async remove(id: string): Promise<{ error?: string }>
        // DELETE /game/record/:id
}

export const gameService = new GameService();
```

---

## Frontend — Files to Modify

### 6. `src/services/base.service.ts`

Add a `delete<T>` protected method alongside `get` and `post`:

```typescript
protected async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'DELETE', headers: this.getHeaders() });
    this.captureRefreshedToken(res);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
```

### 7. `src/App.tsx`

**Remove:**
- The `localStorage.getItem('mahjongData')` initializer in `useState` (start with `[]`)
- The debounced `localStorage.setItem` effect and its timer
- `isFirstRender` ref
- `isSaving` state (repurpose it or remove it — the autosave indicator was tied to localStorage)

**Add:**
- `isLoadingRecords: boolean` state (starts `true` after auth resolves)
- `useEffect` that fires when `user` changes from null → AuthedUser: calls `gameService.getAll()`, sets records, sets `isLoadingRecords = false`

**Update handlers** — optimistic UI (state updates immediately, API call fires async):
```
addRecord    → prepend new record to state, then gameService.save(newRecord)
updateRecord → apply patch to state, then gameService.save(mergedRecord)
deleteRecord → filter from state, then gameService.remove(id)
```

**Render gates** (in order):
```
authLoading       → spinner (.auth-loading / .auth-spinner)
!user             → <AuthScreen>
isLoadingRecords  → spinner
else              → main app
```

---

## Implementation Order

1. `model/game.model.ts`
2. `core/respository/game.repository.ts`
3. `core/service/game.service.ts`
4. `core/controller/api.controller.ts` (add GameService + 3 endpoints)
5. `src/services/base.service.ts` (add `delete`)
6. `src/services/game.service.ts`
7. `src/App.tsx`

---

## Verification

1. Start MongoDB and backend: `cd core && node server.ts`
2. Start frontend: `npm run dev` — cold load shows auth screen
3. Log in → brief spinner while `GET /game/records` runs → app loads with empty list
4. Add a game row → appears immediately in UI; verify it exists in MongoDB `game_records`
5. Edit a record field → refresh the page; change must survive (loaded from DB, not localStorage)
6. Delete a record → gone in UI and in DB
7. Log out, log in as a different user → their records are isolated
8. Confirm `localStorage.mahjongData` is never written during any operation
