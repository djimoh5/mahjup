# Plan: Add URL Routes for Each Tab

## Context
Currently all tab navigation is pure React state (`activeTab` in App.tsx). Tabs have no URL — refreshing the page always resets to My Tracker, and there's no way to deep-link into a tab. The user wants each tab to have its own URL and for `/` to be the sign-in page.

Target routes:
- `/` — sign-in page (unauthenticated default)
- `/tracker` — My Tracker tab
- `/reference` — Card Reference tab
- `/summary` — Summary tab
- `/invite` — existing invite deep-link (keep working)

## Implementation Steps

### 1. Install react-router-dom
```bash
npm install react-router-dom
```

### 2. Wrap app with BrowserRouter — `src/main.tsx`
Import `BrowserRouter` from `react-router-dom` and wrap `<App />` with it (inside `ThemeProvider`).

### 3. Update `src/App.tsx`
- Remove the `activeTab` state and its type import.
- Remove the manual `window.location.pathname === '/invite'` check — replace with a Route.
- Use `useNavigate` / `useLocation` to derive the active tab from the URL path.
- After successful auth, redirect to `/tracker` (or the path the user was already on if it's a valid tab path).
- Tab render logic stays as CSS `display: none/block`, just keyed off `location.pathname` instead of `activeTab` state.
- Export `Tab` type stays the same; add a helper `pathToTab` / `tabToPath` mapping:
  ```ts
  const TAB_PATHS: Record<Tab, string> = {
    tracker: '/tracker',
    hands: '/reference',
    summary: '/summary',
  };
  ```

### 4. Update `src/components/Header.tsx`
- Accept `activeTab` derived from the URL (no change to prop interface needed — App still passes `activeTab`).
- Change `onTabChange` handler to call `navigate(TAB_PATHS[tab])` instead of `setActiveTab(tab)`. Pass `navigate` down, or move the navigate call into Header by importing `useNavigate` directly.
- Simplest approach: keep the `onTabChange` prop signature unchanged; App passes `(tab) => navigate(TAB_PATHS[tab])` as the handler.

### 5. Handle `/invite` route
- The current logic checks `window.location.pathname === '/invite'` in App.tsx and shows `<InviteScreen>`.
- With react-router, wrap the invite check in a `<Route path="/invite">` using `useRoutes` or a conditional in App. Since App is the single-component entry, the simplest approach is to keep the conditional but use `location.pathname` from `useLocation()` instead of `window.location.pathname`.

### 6. Vite dev server — SPA fallback
Vite's dev server already returns `index.html` for unknown routes by default. No change needed.

### 7. Production (Express / Lambda) — SPA fallback
Check `server/server.ts` — it likely already has a catch-all that serves `index.html`. If not, add one after all API routes.

## Critical Files
- [src/main.tsx](src/main.tsx) — add `BrowserRouter` wrapper
- [src/App.tsx](src/App.tsx) — replace `activeTab` state with URL-derived tab, use `useNavigate`; map `/reference` → `'hands'` tab value
- [src/components/Header.tsx](src/components/Header.tsx) — pass `navigate`-based handler for tab changes
- [server/server.ts](server/server.ts) — verify SPA catch-all exists

## Verification
1. `npm run dev` — visit `/`, `/tracker`, `/hands`, `/summary` directly; each should load the correct tab.
2. Refresh on `/summary` — should stay on Summary tab (not reset to tracker).
3. Unauthenticated visit to `/tracker` — should show sign-in (not a blank/broken page).
4. `/invite?code=xxx` — existing invite flow still works.
5. Clicking tabs updates the browser URL bar.
