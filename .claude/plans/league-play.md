# League Play — Implementation Plan

## Decisions locked in (from clarifying questions)

| Question | Decision |
| --- | --- |
| How do we get "distance from you"? | **Browser geolocation API** (`navigator.geolocation`), requested live on the Leagues tab — not stored on the user profile. |
| What defines "popularity"? | **Member count**, cached on the league document and updated on join/leave. |
| How much tournament/competition support ships now? | **Data model only.** Reserve a `Competition` entity linked to a league; bracket/standings UI is a separate future plan. |
| How does the private-league magic link work? | **Extend the existing `Invite` model/email flow** (Mandrill) with an optional `leagueId`, reusing the invite-code redemption path already built for sessions. |

---

## 1. Data model (`model/league.model.ts`)

```ts
export enum LeagueVisibility { Public = 'public', Private = 'private' }

// Who can attach a session/game to the league
export enum LeagueSessionPermission {
    OwnerOnly = 1,           // only the league owner can add sessions/games
    RequiresApproval = 2,    // any member can propose; owner approves/rejects
    Open = 3,                // any member can add, no approval needed
}

export interface League {
    oid: uniqueid;
    ownerId: authid;
    title: string;
    description?: string;
    location?: string;             // free-text display ("Brooklyn, NY"), optional
    geo?: { lat: number; lng: number }; // geocoded from `location`; undefined if not set/geocode failed
    visibility: LeagueVisibility;
    sessionPermission: LeagueSessionPermission;
    joinCode: string;               // required even for public leagues (owner may flip visibility later)
    memberCount: number;            // cached, drives popularity sort
    _ts?: number;
    _tsu?: number;
}

export interface LeagueMembership {
    oid: uniqueid;
    leagueId: uniqueid;
    userId: authid;
    role: 'owner' | 'member';
    joinedAt: number;
}

// Pending "add session/game" proposals under LeagueSessionPermission.RequiresApproval
export interface LeagueAddRequest {
    oid: uniqueid;
    leagueId: uniqueid;
    sessionId: uniqueid;
    requestedBy: authid;
    status: 'pending' | 'approved' | 'rejected';
    _ts?: number;
    _tsu?: number;
}

// Data model only for now — no bracket/standings logic yet
export interface Competition {
    oid: uniqueid;
    leagueId: uniqueid;
    title: string;
    description?: string;
    type: 'tournament';              // widen the union when other competition types are designed
    startDate?: string;
    endDate?: string;
    sessionIds: uniqueid[];
    createdBy: authid;
    _ts?: number;
    _tsu?: number;
}
```

**Existing models touched:**
- `MahjSession` gains `leagueId?: uniqueid`. A session belongs to at most one league (see open question below).
- `Invite` gains `leagueId?: uniqueid` so a redeemed invite can join a league instead of / in addition to a session.

Collections (singular, underscores for multi-word — per repo convention): `league`, `league_membership`, `league_add_request`, `competition`.
Repositories (hyphens): `league.repository.ts`, `league-membership.repository.ts`, `league-add-request.repository.ts`, `competition.repository.ts`.

---

## 2. Backend

**`server/service/league.service.ts`**
- `createLeague(owner, input)` — validates title, generates a short `joinCode` (à la `Common.uniqueId()`, truncated/formatted like an invite code), geocodes `location` → `geo` if provided, creates the league doc + an owner `LeagueMembership`.
- `updateLeague(leagueId, owner, patch)` — owner-only; re-geocodes if `location` changes.
- `listPublicLeagues(viewerGeo?, sort)` — sorts by `memberCount` desc (popularity) or haversine distance from `viewerGeo` to each league's `geo` (leagues without `geo` sort last under distance mode).
- `listMyLeagues(userId)` — leagues where user is owner or member.
- `joinByCode(userId, code)` — validates code, creates membership, increments `memberCount`.
- `inviteToLeague(owner, leagueId, email)` — reuses `InviteRepository`/`EmailService`, sets `leagueId` on the `Invite`.
- `redeemInvite(...)` — existing invite redemption path branches: if `invite.leagueId` is set, create membership instead of / in addition to session access.
- `leaveLeague(userId, leagueId)` — removes membership, decrements `memberCount`; owner cannot leave without transferring ownership (see open question).
- `requestAddSession(userId, leagueId, sessionId)` / `approveAddRequest` / `rejectAddRequest` — enforces `sessionPermission`:
  - `OwnerOnly` → only owner can call the direct add; others get `forbiddenAccess`.
  - `RequiresApproval` → member creates a `LeagueAddRequest`; only owner can approve/reject; approval sets `session.leagueId`.
  - `Open` → member call sets `session.leagueId` directly, no request row created.
- `getLeagueStats(leagueId)` — owner-only; aggregates `GameRecord`/`GameAnalysis`-style stats (wins, avg score, hands played) across sessions where `session.leagueId === leagueId`, joined against `LeagueMembership` for member identity. Reuses the filtering approach already in `model/game-analysis.model.ts` rather than inventing a new one.

**`server/controller/league.controller.ts`** (routes mounted at `/league`):
```
GET    /league/public?lat=&lng=&sort=popularity|distance
GET    /league/mine
POST   /league
PUT    /league/:id
POST   /league/:id/join            { code }
POST   /league/:id/invite          { email }
POST   /league/:id/leave
GET    /league/:id/stats
GET    /league/:id/requests        (owner only)
POST   /league/:id/requests/:reqId/approve
POST   /league/:id/requests/:reqId/reject
POST   /league/:id/sessions        { sessionId }   // add or request-to-add, per permission
```

Follows the existing `@Get`/`@Post` decorator + `ApiFactory` pattern from `base.controller.ts`; auth via `req.session.user` like every other controller (no `@AllowAnonymous`, unlike `AdminController`).

**Geocoding**: no provider is wired up in this repo today. Needs a decision — see open questions.

---

## 3. Frontend

- New top-level tab, **Leagues**, alongside Tracker / Reference / Summary in `src/App.tsx`'s tab bar.
- `src/services/league.service.ts` — thin fetch wrapper extending `BaseService`, same pattern as `mahj-session.service.ts`.
- `src/components/LeaguesTab.tsx` — two sub-views:
  - **Discover**: public leagues, sort toggle (Popularity / Distance). On mount, tries `navigator.geolocation.getCurrentPosition`; if denied/unavailable, disables the Distance option with a tooltip explaining why, and defaults to Popularity.
  - **Mine**: leagues you own or belong to, with a "Create League" button opening `CreateLeagueDialog` (title, description, location, visibility, session permission).
- `LeagueCard.tsx` — summary card (title, member count, distance-if-known, join button for public / not-yet-member).
- `LeagueDetailPage.tsx` — members list, join code + "invite by email" (owner only), pending add-requests queue (owner only, if `RequiresApproval`), stats panel (owner only, reuses chart patterns from `AdminStatsTab`/`SummaryTab` per the `dataviz` skill).
- **Add to League** button on `GameRow`/`GameCardMobile` and the session header in `TrackerTab` — visible only when the current user has a league where `sessionPermission` allows them to add, or is owner. Click either adds directly (`Open`/`OwnerOnly`-as-owner) or files a request (`RequiresApproval`), with an inline pending-state indicator on the session afterward.

---

## 4. Rollout phases

1. **Core**: League/Membership models, create/join/leave, public discovery list (popularity sort only), Leagues tab with Discover/Mine.
2. **Permissions**: `sessionPermission` enforcement, Add-to-League button, approval queue.
3. **Invites**: extend `Invite`/email flow with `leagueId`, magic-link join.
4. **Geo**: geocode league `location`, wire up browser geolocation + distance sort.
5. **Stats**: owner-facing league statistics panel.
6. **Competitions**: `Competition` data model lands here as schema-only (no UI) — unblocks a future tournaments plan without redesigning the league schema later.

---

## 5. Open questions / suggestions for later

These weren't asked up front because they're refinements rather than blockers — worth a decision before or during implementation:

- **Geocoding provider**: no geocoder is integrated anywhere in this codebase today. Options are a free/rate-limited service (OpenStreetMap Nominatim) or a paid API (Google Geocoding) requiring a new Secrets Manager entry. Recommend Nominatim to start given low expected league-creation volume.
- **One league per session, or many?** This plan assumes a session/game belongs to at most one league (`leagueId` singular). If players want a session to count toward two leagues at once (e.g. a regular game night that's also part of a seasonal competition), that needs `leagueId` to become `leagueIds: uniqueid[]` — worth deciding before the field ships, since widening it later is a migration.
- **Retroactive linking**: can a session created before joining a league be attached to it after the fact, or only sessions created going forward? Recommend allowing retroactive linking via the same Add-to-League button.
- **Leaving / ownership transfer**: what happens if the owner wants to leave or the league needs a new owner? Needs an explicit "transfer ownership" action, or ownership stays fixed for v1 and the owner can only delete the league.
- **Deleting a league**: soft-delete (keep sessions, just null out `leagueId`) vs hard-delete with cascading cleanup of memberships/requests.
- **Join code lifecycle**: should codes expire/regenerate like `Invite.inviteExpiry`, to prevent an old leaked code from granting indefinite access to a private league?
- **Visibility of stats/roster pre-join**: can non-members see a public league's member list or stats before joining, or only after?
- **Notifications**: there's no push/in-app notification system in the codebase today — pending add-request approvals and invite emails would rely entirely on the existing Mandrill email service. Confirm that's sufficient for v1 (no in-app badge/notification center).
