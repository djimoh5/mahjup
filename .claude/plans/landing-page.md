# Landing Page Plan

## Context
MahjUp currently shows `AuthScreen` directly when a user is not authenticated. The goal is to add a proper landing page that greets unauthenticated visitors with the brand header (logo + Login/Sign Up CTAs) and a hero section, before they enter the auth flow. This matches the existing app theme (dark forest green header, coral accents, frosted glass, Inter font, mahjong table background).

---

## Files to Change

| File | Action |
|---|---|
| `src/components/LandingPage.tsx` | **Create** — new landing page component |
| `src/components/AuthScreen.tsx` | **Modify** — add optional `initialMode` prop |
| `src/App.tsx` | **Modify** — add `showAuth` state to gate landing vs auth |

---

## Implementation

### 1. `AuthScreen.tsx` — add `initialMode` prop
Add `initialMode?: 'login' | 'register'` to the `Props` interface and pass it to `useState<AuthMode>`:
```ts
interface Props {
  onAuthenticated: (user: AuthedUser) => void;
  initialMode?: 'login' | 'register';
}
// change:
const [mode, setMode] = useState<AuthMode>(initialMode ?? 'login');
```

### 2. `LandingPage.tsx` — new component
- **Props**: `onLogin: () => void`, `onSignUp: () => void`
- **Header** (mirrors `Header.tsx` top bar, no nav tabs):
  - `background: 'rgba(13,74,47,0.88)'`, `backdropFilter: 'blur(16px)'`, `borderRadius: '1rem'`, `boxShadow` — exact same style tokens as `Header.tsx`
  - Left: `mahjup-logo-light.png` at `width: 170px`
  - Right: "Log In" (MUI `Button` variant `outlined`, white border/text) + "Sign Up" (MUI `Button` variant `contained`, coral `#e8877a`)
- **Hero section** (centered, full remaining viewport height):
  - Frosted-glass `Paper` card (same style as `AuthScreen`'s card — `backdropFilter: 'blur(20px)'`, white border, `borderRadius: '1.5rem'`)
  - Tagline: **"Track. Analyze. Improve."** — large bold heading, color `#0a2818`
  - Subtitle: one-liner about the app
  - "Get Started" `Button` (contained coral) → calls `onSignUp`
- **Layout**: `Box` with `minHeight: '100vh'`, `display: 'flex'`, `flexDirection: 'column'`, `px` matching App wrapper padding

### 3. `App.tsx` — gate between landing and auth
Add two state values:
```ts
const [showAuth, setShowAuth] = useState(false);
const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
```
Update the `!user` render branch:
```tsx
if (!user) {
  if (!showAuth) {
    return (
      <LandingPage
        onLogin={() => { setAuthInitialMode('login'); setShowAuth(true); }}
        onSignUp={() => { setAuthInitialMode('register'); setShowAuth(true); }}
      />
    );
  }
  return <AuthScreen initialMode={authInitialMode} onAuthenticated={handleAuthenticated} />;
}
```
Update `handleLogout` to also `setShowAuth(false)` so returning to `/` shows the landing page again.

---

## Verification
1. `npm run dev` — visit `/`; landing page renders with dark green header, logo, Log In + Sign Up buttons
2. Click **Log In** → AuthScreen opens in Sign In mode
3. Click **Sign Up** → AuthScreen opens in Register mode
4. Complete auth → redirects to `/tracker`; standard app header shown
5. Log out → returns to landing page (not AuthScreen directly)
6. `npm run build` — no TypeScript errors
