# Plan: MahjSession Player OID Migration

## Context

MahjSession currently stores `players` as `string[]` (free-form text names entered by the user). This makes it impossible to link players to real user accounts, show consistent names, or enable features like shared session analytics. The fix replaces free-form text entry with a user-picker dropdown backed by real user OIDs (`authid[]`), adds an invite flow so new players can be added by email, and resolves OIDs to display names everywhere players are shown.

---

## Critical Files

| File | Change |
|---|---|
| `model/mahj-session.model.ts` | `players: string[]` → `players: authid[]` |
| `model/user.model.ts` | Add `UserSummary` interface |
| `core/repository/auth.repository.ts` | Add `getAll()` method |
| `core/service/auth.service.ts` | Update `invite()` return type; add `getUserList()` |
| `core/controller/api.controller.ts` | Add `GET /user/list`; invite response now includes OID |
| `src/services/user.service.ts` | New service: `getAll()` and `invite(email)` |
| `src/App.tsx` | Load users, build `usersMap`, update `addSession()`, pass down |
| `src/components/TrackerTab.tsx` | Pass `users`, `usersMap`, `currentUserOid` as props |
| `src/components/SessionGroup.tsx` | Replace text inputs with MUI Autocomplete + invite Dialog |
| `src/components/GameRow.tsx` | Add `usersMap` prop; resolve OIDs in dropdowns |
| `src/components/GameCardMobile.tsx` | Same as GameRow |
| `src/components/SummaryTab.tsx` | Change win detection from `endsWith(' (me)')` to OID equality |

---

## Implementation Steps

### 1. Model: Add `UserSummary` — `model/user.model.ts`

Add after `UserProfile`:
```ts
export interface UserSummary {
    oid: authid;
    username: string;
    firstName?: string;
    lastName?: string;
    virtual?: boolean;
}
```
Import `authid` (already imported in this file).

### 2. Model: Change `players` type — `model/mahj-session.model.ts`

```ts
import { authid, uniqueid } from './id.model';
// players: string[]  →  players: authid[]
```

### 3. Backend repository: Add `getAll()` — `core/repository/auth.repository.ts`

Add method that excludes passwords:
```ts
async getAll(): Promise<UserAuth[]> {
    return this.context.find({}, { password: 0 });
}
```
Match the projection pattern already used in `getByUsername()`.

### 4. Backend service — `core/service/auth.service.ts`

**4a. Change `invite()` return type to include OID:**
- Signature: `async invite(username: string, invitedBy: string): Promise<ApiResponse<{ oid: authid }>>`
- After creating/finding the virtual `UserAuth`, return `new ApiResponse(true, { oid: userAuth.oid })` instead of `new ApiResponse(true, null)`
- For the branch where user already exists as virtual, `auth.oid` is available before the early-return guard — return it there too

**4b. Add `getUserList()` method:**
```ts
async getUserList(): Promise<ApiResponse<UserSummary[]>> {
    const users = await this.authRepository.getAll();
    const profiles = await Promise.all(
        users.map(u => this.userProfileRepository.getByAuthOid(u.oid).catch(() => null))
    );
    const summaries: UserSummary[] = users.map((u, i) => ({
        oid: u.oid,
        username: u.username,
        firstName: profiles[i]?.firstName,
        lastName: profiles[i]?.lastName,
        virtual: u.virtual,
    }));
    return new ApiResponse(true, summaries);
}
```
`userProfileRepository` is already injected into `AuthService` (check constructor injection in `core/config/bootstrap.ts`; add if missing).

### 5. Backend controller — `core/controller/api.controller.ts`

Add `GET /user/list` endpoint (auth required):
```ts
@Get('user/list')
async getUserList(req: Request, res: Response) {
    const result = await this.authService.getUserList();
    res.send(result);
}
```
The invite endpoint body (`@Post auth/invite`) already calls `authService.invite(...)` and sends the response — the type change in step 4a propagates automatically.

### 6a. Frontend: Add `invite()` to `src/services/auth.service.ts` (existing file)

Add to `AuthService` class — invite belongs with the other auth flows:
```ts
async invite(email: string): Promise<{ oid: string | null; error?: string }> {
    try {
        const res = await this.post<ApiResponse<{ oid: string }>>(
            '/auth/invite', { username: email }
        );
        if (res.success && res.data) return { oid: res.data.oid };
        return { oid: null, error: res.msg ?? 'Invite failed' };
    } catch {
        return { oid: null, error: 'Unable to connect to the server' };
    }
}
```

### 6b. Frontend service — `src/services/user.service.ts` (new file, getAll only)

```ts
import { BaseService } from './base.service';
import type { UserSummary } from '../../model/user.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

export class UserService extends BaseService {
    async getAll(): Promise<{ users: UserSummary[] }> {
        const res = await this.get<ApiResponse<UserSummary[]>>('/user/list');
        return { users: res.data ?? [] };
    }
}

export const userService = new UserService();
```

### 7. Frontend: `src/App.tsx`

**7a. Add `users` state and fetch on login:**
```ts
const [users, setUsers] = useState<UserSummary[]>([]);
// In Promise.all useEffect, add:
const { users: fetchedUsers } = await userService.getAll();
setUsers(fetchedUsers);
```

**7b. Build `usersMap` (memoized):**
```ts
const usersMap = useMemo(
    () => Object.fromEntries(users.map(u => [u.oid, u])),
    [users]
);
```

**7c. Change `addSession()` first player from name string to OID:**
```ts
players: [user!.oid as unknown as authid]
```

**7d. Add `handleUserAdded` callback:**
```ts
function handleUserAdded(newUser: UserSummary) {
    setUsers(prev => [...prev, newUser]);
}
```

**7e. Pass `users`, `usersMap`, `currentUserOid={user!.oid}`, `onUserAdded={handleUserAdded}` to `TrackerTab`.**

### 8. `src/components/TrackerTab.tsx`

Add to props: `users: UserSummary[]`, `usersMap: Record<string, UserSummary>`, `currentUserOid: string`, `onUserAdded: (u: UserSummary) => void`. Thread all four down to each `<SessionGroup>`.

### 9. `src/components/SessionGroup.tsx` — main UI change

**Props additions:** `users`, `usersMap`, `currentUserOid`, `onUserAdded`

**Header chips** (where players are displayed as `<Chip>`s): replace `label={player}` with `label={resolveDisplayName(player, usersMap)}`.

**Edit form — replace the entire player text-input section** with a MUI `Autocomplete` (multiple):

- `options`: `[...users, INVITE_SENTINEL]` where `INVITE_SENTINEL = { oid: '__invite__', username: '__invite__' } as UserSummary`
- `value`: `users.filter(u => editPlayers.includes(u.oid))`
- `getOptionLabel`: `"First Last"` or `username`, or `"+ Invite new player…"` for sentinel
- `onChange`: if selection includes sentinel, open invite dialog without adding sentinel to `editPlayers`; otherwise `setEditPlayers(selected.map(u => u.oid))`
- `renderTags`: chips using display name
- `renderOption`: custom render to style the invite sentinel differently (e.g. with a `+` icon)
- `isOptionEqualToValue`: compare by `oid`

**Invite Dialog** (local state: `inviteOpen`, `inviteEmail`, `inviteLoading`, `inviteError`):
- `TextField` for email address
- On confirm: call `authService.invite(inviteEmail)`, on success add OID to `editPlayers` and call `onUserAdded({ oid, username: inviteEmail })`, close dialog
- On error: show error inline

**`handleSave()`**: no change needed — already calls `onUpdateSession({ players: editPlayers })`. With OIDs, this is correct.

### 10. `src/components/GameRow.tsx`

Add `usersMap: Record<string, UserSummary>` to props. Apply `resolveDisplayName(oid, usersMap)` as the label in:
- Winner `Select` → `MenuItem` labels
- Participant checkbox labels

Keep `value` as the OID string (unchanged).

### 11. `src/components/GameCardMobile.tsx`

Same changes as step 10.

### 12. `src/components/SummaryTab.tsx`

Add `currentUserOid: string` to props (passed from App.tsx). Change win filter from:
```ts
d.winner.endsWith(' (me)')
```
to:
```ts
d.winner === currentUserOid
```
For transitional backward compat with old records, keep both: `d.winner === currentUserOid || d.winner.endsWith(' (me)')`.

---

## Shared Helper: `resolveDisplayName`

Add to `src/utils/user.ts` (new file):
```ts
import type { UserSummary } from '../../model/user.model';

export function resolveDisplayName(
    oidOrName: string,
    usersMap: Record<string, UserSummary>
): string {
    const user = usersMap[oidOrName];
    if (!user) return oidOrName; // backward compat: old free-text name
    if (user.firstName || user.lastName)
        return [user.firstName, user.lastName].filter(Boolean).join(' ');
    return user.username;
}
```

---

## Backward Compatibility

- Old sessions in MongoDB have `players: string[]` of free-text names.
- `resolveDisplayName` returns the raw string when the value is not found in `usersMap`.
- No data migration required — old sessions render their stored names gracefully.
- `participants` on `GameRecord` remains `string[]` at runtime; values are now OIDs for new records.

---

## Verification

1. Run backend: `cd core && npm start` (or via Lambda emulator)
2. `GET /user/list` returns array of `{ oid, username, firstName?, lastName? }`
3. `POST /auth/invite` with `{ username: "test@example.com" }` returns `{ success: true, data: { oid: "..." } }`
4. Run frontend: `npm run dev`
5. Create a session → first player chip should show your display name (not a raw OID string)
6. Edit session players → Autocomplete shows existing users by name
7. Select "Invite new player…" → dialog opens, enter email, confirm → new chip appears immediately
8. Open a game row → winner dropdown shows display names
9. Check Summary tab → your wins are counted correctly
10. Load an old session (if any) → legacy player names still display correctly
