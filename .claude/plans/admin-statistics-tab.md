# Admin: Statistics Tab

## Context

The `/admin` data-viewer page (built earlier this session — `AdminApp.tsx`, `AdminHeader.tsx`, `AdminDataTab.tsx`, `AdminUserAccordion.tsx`, `AdminSessionCard.tsx`, `AdminAnalysisCard.tsx`, backed by `server/service/admin.service.ts` + `server/controller/admin.controller.ts`) currently has a single "Data" tab. The user wants a second tab, "Statistics," with cross-user leaderboards. Requested metrics: most sessions created, most usage time, most players connected to.

Investigated "most usage time" — **there is no tracking of login/session duration anywhere in the codebase** (`server/lib/session.ts` has a `SessionLog`/`sessionLogRepository` mechanism, but it's entirely commented-out dead code with no backing repository, and no login timestamp is ever written to `UserAuth`). Building it would mean standing up new instrumentation with no historical data to show. **The user confirmed this metric should be skipped for now.**

Clarified scope:
- **Most sessions created**: rank users by count of `MahjSession` where they are the creator (`session.userId`).
- **Most connections**: for "connected to the most players," the user chose unique co-players (people they've shared a game with) **plus** invite relationships (people they've invited or been invited by), not just co-players alone.

## Backend

1. **`server/repository/invite.repository.ts`** — add `getAll(): Promise<Invite[]> { return this.context.find({}); }` (no existing unscoped query; `getByInvitedBy`/`getAllByUsername` are per-user only).

2. **`server/service/admin.service.ts`** — inject `InviteRepository` in the constructor; add `invites: Invite[]` to the `AdminData` interface; include `this.inviteRepository.getAll()` in the existing `Promise.all([...])` in `getAllData()` and add it to the returned object.

## Frontend

1. **`src/services/admin.service.ts`** — import `Invite` from `../../model/invite.model`, add `invites: Invite[]` to the `AdminData` interface (server payload already includes it after the backend change above).

2. **New `src/components/AdminStatsTab.tsx`**:
   - Props: `users: UserSummary[]`, `sessions: MahjSession[]`, `records: GameRecord[]`, `invites: Invite[]`.
   - `computeSessionCreatorCounts(sessions)` — tally by `session.userId`.
   - `computeConnectionCounts(users, records, invites)` — build a `username → oid` map from `users` (invited usernames always have a corresponding `UserAuth`, real or virtual, per `AuthService.invite()`), then for each user accumulate a `Set` of connected oids from: (a) every other participant in any game record they appear in, and (b) invite relationships in both directions (`invitedBy` ↔ resolved invitee oid). Return counts as set sizes.
   - Renders two `Paper` leaderboard cards side by side (`Grid`, same `pieCardSx`-style card used in `SummaryTab.tsx`), each showing users ranked descending by their metric: top 3 get the existing medal-circle treatment (colored circle + "1st"/"2nd"/"3rd", the same pattern already used for "Most Played With"/"Toughest Opponents" in `src/components/SummaryTab.tsx:280-336`), and the remainder listed below with a plain rank number — full list, not sliced to top 3, since this is an admin-wide view. Users with a zero count for a given metric are omitted from that leaderboard. Uses `resolveDisplayName` (from `src/utils/user.ts`) for names, consistent with the rest of the admin page.

3. **`src/components/AdminApp.tsx`** — extend `export type AdminTab = 'data' | 'stats';`, add a render branch for `activeTab === 'stats'` rendering `AdminStatsTab` with `users`, `sessions`, `records`, `invites` from `data`.

4. **`src/components/AdminHeader.tsx`** — add `<Tab label="Statistics" value="stats" />` alongside the existing "Data" tab.

## Verification

- `npx tsc --noEmit -p tsconfig.json` (frontend) and `npx tsc -p server/tsconfig.json --noEmit` (backend).
- Manually load `/admin`, confirm the "Data" tab is unchanged, switch to "Statistics," and sanity-check: session-creator counts sum to the total number of sessions with a `userId`; connection counts are symmetric (if A is connected to B, B is connected to A) and never include self.
