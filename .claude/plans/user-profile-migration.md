# Plan: Embed UserProfile in UserAuth responses

## Context
`firstName` and `lastName` were moved from `UserAuth` to a separate `UserProfile` model (linked by `authOid`). `Header.tsx` and `App.tsx` still reference these fields directly on the `UserAuth` object (`user.firstName`, `user.lastName`), causing runtime failures. Additionally, `App.tsx` imports a `AuthedUser` type that was never exported from `src/services/auth.service.ts`.

The fix: add an optional `profile?: UserProfile` virtual field to `UserAuth` that the backend populates on every successful auth response, so the frontend receives a single merged object with no extra API calls.

---

## Files to Modify

| File | Change |
|---|---|
| `model/auth.model.ts` | Add `profile?: UserProfile` to `UserAuth` |
| `server/service/auth.service.ts` | Inject `UserProfileRepository`; attach profile after successful auth |
| `server/controller/api.controller.ts` | Return `UserAuth + profile` from `POST /user/profile` |
| `src/services/auth.service.ts` | Export `type AuthedUser = UserAuth`; fix `updateProfile` return type |
| `src/components/Header.tsx` | Replace `user.firstName/lastName` → `user.profile?.firstName/lastName` |
| `src/App.tsx` | Replace `user!.firstName` → `user!.profile?.firstName` |

---

## Step-by-Step Implementation

### 1. `model/auth.model.ts`
Import `UserProfile` and add the virtual field:
```ts
import { UserProfile } from './user.model';

export class UserAuth {
    oid: authid;
    token?: string;
    virtual?: boolean;
    profile?: UserProfile;   // ← add this
    constructor(public username: string, public password: string) { ... }
}
```
`profile` is never persisted (the repository only writes credential fields), so it stays "virtual."

### 2. `server/service/auth.service.ts`
- Add `UserProfileRepository` as the last constructor parameter (DI order matters).
- Add a private helper:
  ```ts
  private async attachProfile(auth: UserAuth): Promise<UserAuth> {
      const profile = await this.userProfileRepository.getByAuthOid(auth.oid);
      if (profile) auth.profile = profile;
      return auth;
  }
  ```
- Call `attachProfile` in two places:
  - `login()` — before returning `new ApiResponse(true, auth)`
  - `verifyLoginCode()` — before returning `new ApiResponse(true, auth)`
- `persistAuth()` (new registrations) does NOT need it — new users have no profile yet; `undefined` is intentional.

### 3. `server/controller/api.controller.ts` — `POST /user/profile`
After updating the profile, attach it to the session user and return `UserAuth`:
```ts
@Post('user/profile')
async updateProfile(req: Request, res: Response) {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName) {
        return this.sendError(res, 'firstName and lastName are required');
    }
    const profileResult = await this.userProfileService.updateProfile(
        AuthId(req.session.user.oid), firstName, lastName
    );
    if (!profileResult.success) return res.send(profileResult);
    const auth = { ...req.session.user, profile: profileResult.data };
    res.send(new ApiResponse(true, auth));
}
```
This returns a `UserAuth`-shaped object (matching what the client expects) without an extra DB round-trip.

### 4. `src/services/auth.service.ts`
- Add `export type AuthedUser = UserAuth;` (fixes the broken import in `App.tsx`).
- Change `updateProfile` return type annotation from `ApiResponse<UserAuth>` to `ApiResponse<UserAuth>` (already correct shape, but the actual server response now matches).

### 5. `src/components/Header.tsx`
Replace all 6 direct field accesses:

| Old | New |
|---|---|
| `user.firstName` | `user.profile?.firstName` |
| `user.lastName` | `user.profile?.lastName` |

Affected lines: `getInitials` (35-41), `getDisplayName` (43-48), `useState` initializers (60-61), `handleOpenAccount` (74-75).

The `handleSaveAccount` flow already works: it calls `authService.updateProfile` which now returns a `UserAuth` with `profile` populated — `onUserUpdate(updated)` will correctly refresh the header.

### 6. `src/App.tsx`
Line 91: `user!.firstName` → `user!.profile?.firstName`

---

## Verification

1. **Login flow**: After login/code-verify, the auth response should include `data.profile.firstName/lastName` if the user has a saved profile.
2. **New user**: `data.profile` is `undefined`; header falls back to `username[0]` for initials — no crash.
3. **Edit name in Header**: Save triggers `POST /user/profile` → response is now a `UserAuth` with embedded `profile` → `onUserUpdate` sets the new user state → header re-renders with updated name.
4. **TypeScript**: No type errors — `AuthedUser` resolves, `user.profile?.firstName` is safe optional chaining.
