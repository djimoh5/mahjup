# MUI Migration Plan

## Context

MahjUp's frontend is currently built with vanilla React + a single 1,245-line `styles.css`. The user has installed `@mui/material@^9.0.1`, `@emotion/react`, and `@emotion/styled`. The goal is to migrate all 9 UI components to use MUI components + `sx` props while preserving the existing color scheme (dark green header, coral primary, glassmorphism cards) and all functionality.

No `@mui/icons-material` will be installed. Instead, a shared icon file centralizes the 6 inline SVGs already scattered across components — zero bundle cost, zero duplication.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `src/theme.ts` | **Create** — MUI custom theme |
| `src/components/icons/Icons.tsx` | **Create** — shared SVG icons |
| `src/main.tsx` | Add `ThemeProvider` + `CssBaseline` |
| `src/styles.css` | Strip to 6-line body background rule |
| `src/App.tsx` | Box layout, CircularProgress |
| `src/components/AuthScreen.tsx` | Paper, TextField, Button, Alert |
| `src/components/Header.tsx` | Box, Tabs, Tab, Button, Typography |
| `src/components/TrackerTab.tsx` | Box, Stack, Button |
| `src/components/SessionGroup.tsx` | Paper, Collapse, Chip, TextField, Button, IconButton |
| `src/components/GameRow.tsx` | Select, MenuItem, TextField, Checkbox, IconButton (inside native `<tr>`/`<td>`) |
| `src/components/GameCardMobile.tsx` | Paper, Card, Select, TextField, Checkbox, Chip, IconButton |
| `src/components/ReferenceTab.tsx` | Grid, Paper, Chip, Typography |
| `src/components/SummaryTab.tsx` | Grid, Paper, LinearProgress, Typography |

---

## Step 0 — Infrastructure

### 0a. Create `src/theme.ts`

Custom theme preserving the existing design language:

```ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#e8877a', dark: '#cf6e62', contrastText: '#fff' },
    text: { primary: '#0a2818', secondary: '#2e5e42' },
    background: { paper: 'rgba(255,255,255,0.88)' },
    divider: 'rgba(242,171,164,0.55)',
  },
  typography: { fontFamily: '"Inter", sans-serif' },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // scrollbar + @keyframes ping (for Header syncing indicator)
        '@keyframes ping': { '75%, 100%': { transform: 'scale(2)', opacity: 0 } },
        '::-webkit-scrollbar': { width: 8, height: 8 },
        '::-webkit-scrollbar-track': { background: 'rgba(195,225,208,0.3)' },
        '::-webkit-scrollbar-thumb': { background: 'rgba(232,135,122,0.35)', borderRadius: 4 },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(232,135,122,0.15)',
          borderRadius: '1.5rem',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        containedPrimary: {
          borderRadius: '0.75rem', fontWeight: 700, textTransform: 'none',
          boxShadow: '0 4px 6px -1px rgba(232,135,122,0.35)',
          '&:active': { transform: 'scale(0.95)' },
        },
      },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiChip: {
      styleOverrides: {
        root: {
          background: 'rgba(46,94,66,0.1)', color: '#2e5e42',
          border: '1px solid rgba(46,94,66,0.2)', fontSize: '0.75rem', height: 24,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: '0.75rem', borderRadius: 9999, background: 'rgba(250,208,200,0.55)' },
        bar: { background: '#e8877a', borderRadius: 9999 },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: { color: 'rgba(46,94,66,0.4)', padding: '2px', '&.Mui-checked': { color: '#e8877a' } },
      },
    },
  },
});

export default theme;
```

### 0b. Create `src/components/icons/Icons.tsx`

Six named SVG components used across all files:
- `PlusIcon`, `PencilIcon`, `TrashIcon`, `ChevronDownIcon`, `CheckIcon`, `CheckCircleIcon`

Each renders a 24×24 SVG accepting `React.SVGProps<SVGSVGElement>`.

### 0c. Update `src/main.tsx`

```tsx
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

<ThemeProvider theme={theme}>
  <CssBaseline />
  <App />
</ThemeProvider>
```

### 0d. Strip `src/styles.css` to:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

body {
  background-image: url('../Assets/mahjong-table-backround.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
```

Everything else (colors, layout, component classes, animations) moves to the theme or `sx` props.

---

## Step 1 — App shell: `App.tsx`

- Loading spinner: `<Box sx={{ minHeight: '100vh', display: 'flex', ... }}><CircularProgress /></Box>`
- `app-container` → `<Box sx={{ maxWidth: '80rem', mx: 'auto', ... }}>`
- `app-main` → `<Box component="main" sx={{ flexGrow: 1 }}>`
- Tab visibility: `sx={{ display: activeTab === X ? 'block' : 'none' }}`

---

## Step 2 — Auth: `AuthScreen.tsx`

- Overlay: `<Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>`
- Card: `<Paper sx={{ maxWidth: 420, backdropFilter: 'blur(20px)', p: '2.5rem 2rem', ... }}>` (override theme's 8px blur)
- Mode toggle: Two `<Button>` pills in a `<Box>` container (NOT MUI `Tabs` — the pill toggle fights MUI's underline pattern)
- Form fields: `<TextField>` with `fullWidth size="small"`
- Error: `<Alert severity="error" variant="outlined">`
- Submit: `<Button variant="contained" color="primary" fullWidth type="submit">`

---

## Step 3 — Header: `Header.tsx`

The header is in document flow (not `position: fixed`), so use a styled `<Box component="header">` rather than `AppBar` to avoid fighting MUI defaults.

- Outer shell: `<Box component="header" sx={{ background: 'rgba(13,74,47,0.88)', backdropFilter: 'blur(16px)', borderRadius: '1rem', mb: 3, ... }}>`
- Top bar: flex row with logo `<img>`, date `<Typography>`, username, Sign Out `<Button>`
- Sign Out: `<Button variant="outlined" sx={{ color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.4)', ... }}>`
- Ping syncing indicator: keep the two `<span>` elements; use `sx={{ animation: 'ping 1s ...' }}` (keyframes live in theme's `MuiCssBaseline.styleOverrides`)
- Nav strip: `<Box sx={{ background: 'rgba(46,94,66,0.88)' }}>` containing `<Tabs>` with coral indicator:
  ```tsx
  <Tabs value={activeTab} onChange={(_, v) => onTabChange(v)}
    TabIndicatorProps={{ style: { background: '#e8877a', height: 3 } }}
    sx={{ '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', textTransform: 'none' },
          '& .Mui-selected': { color: '#e8877a !important' } }}>
    <Tab label="My Tracker" value="tracker" />
    ...
  </Tabs>
  ```

---

## Step 4 — Tracker: `TrackerTab.tsx`

- Toolbar: `<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>`
- New Session button: `<Button variant="contained" startIcon={<PlusIcon />}>`
- Autosave badge: `<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, background: 'rgba(255,255,255,0.5)', ... }}>` with `<CheckCircleIcon>`
- Sessions list: `<Stack spacing={2}>`
- Empty state: `<Box sx={{ p: '2.5rem', textAlign: 'center', border: '1px dashed ...', ... }}>`

---

## Step 5 — Session: `SessionGroup.tsx`

Structure:
```
<Paper sx={{ borderRadius: '1rem', overflow: 'hidden' }}>
  <Box> // session-header: flex row
    <IconButton> // chevron, rotates via sx transform
    <Box> // info: datetime, title, Chip[] player pills
    <Box> // actions: Add Game Button, edit/delete IconButtons
  </Box>
  {isEditing && <Box> // edit form: Stack of TextField fields
    // Players: Stack of TextField + IconButton rows
    // Footer: Save Button (contained) + Cancel Button (outlined)
  </Box>}
  {isExpanded && !isEditing && <Box> // games area
    // empty state or table/mobile cards
  </Box>}
</Paper>
```

- Player pills: `<Chip key={p} label={p} size="small" />` — theme handles green tint
- `useIsMobile` hook: **keep as-is** (uses 768px; MUI's `sm` = 600px, `md` = 900px — neither matches exactly)

---

## Step 6 — Game table: `GameRow.tsx`

**Keep native `<tr>`/`<td>`** — the `border-spacing` + rounded corner row trick does not map to MUI Table's CSS defaults. This is a pragmatic exception: the table is a layout container, the MUI components are used for interactive controls inside cells.

Keep `custom-table` CSS in `styles.css` (just that block):
```css
.custom-table { border-collapse: separate; border-spacing: 0 4px; width: 100%; }
.custom-table thead th { ... }
.custom-table tbody tr td:first-child { border-radius: 8px 0 0 8px; ... }
.custom-table tbody tr td:last-child { border-radius: 0 8px 8px 0; ... }
```

Inside cells, replace native elements with MUI:
- `<select>` → `<Select size="small">` + `<MenuItem>` for each option
- `<input type="date">` → `<TextField type="date" size="small">`
- `<textarea>` in notes row → `<TextField multiline rows={2} fullWidth>`
- `<input type="checkbox">` → `<Checkbox size="small">` inside `<FormControlLabel>`
- Delete button → `<IconButton size="small"><TrashIcon /></IconButton>` with hover color `#ef4444`
- Score badge → `<Box sx={{ background: 'rgba(250,208,200,0.6)', fontWeight: 700, ... }}>`

---

## Step 7 — Mobile card: `GameCardMobile.tsx`

- Card: `<Paper sx={{ border: isEditing ? '1px solid #e8877a' : undefined, borderRadius: '0.875rem', overflow: 'hidden' }}>`
- Summary row: `<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75 }}>`
  - Date: `<Typography variant="caption">`
  - Win/Loss badge: `<Chip label={...} size="small" sx={{ background: win ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)', ... }}>`
  - Edit pencil: `<IconButton size="small"><PencilIcon /></IconButton>`
- Edit body: `<Stack spacing={1.5} sx={{ p: 1.5, borderTop: '1px solid divider' }}>`
  - Field labels: `<Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>`
  - Dropdowns: `<Select size="small" fullWidth>`
  - Participants: `<FormGroup row>` with `<FormControlLabel control={<Checkbox size="small" />}>`
  - Notes: `<TextField multiline rows={2} fullWidth>`
- Footer: Delete `<Button variant="text" startIcon={<TrashIcon />}>` + Done `<Button variant="contained" startIcon={<CheckIcon />}>`

---

## Step 8 — Reference: `ReferenceTab.tsx`

**MUI v9 Grid note:** Use `size={{ xs: 12, sm: 6, lg: 4 }}` — the old `xs={12}` syntax is removed in v9. No `item` prop needed.

```tsx
<Grid container spacing={3}>
  {Object.entries(handData).map(([category, hands]) => (
    <Grid key={category} size={{ xs: 12, sm: 6, lg: 4 }}>
      <Paper sx={{ borderRadius: '1.5rem', overflow: 'hidden', ... }}>
        <Box sx={{ px: 2, py: 1, background: 'rgba(46,94,66,0.12)', display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>{category}</Typography>
          <Chip label={`${hands.length} Hands`} size="small" />
        </Box>
        <Box sx={{ p: 2, fontFamily: 'monospace', fontSize: '0.6875rem' }}>
          {hands.map(h => (
            <Box key={h.h} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(242,171,164,0.3)', '&:last-child': { borderBottom: 'none' } }}>
              <span>{h.h}</span>
              <Typography component="span" sx={{ fontWeight: 900, color: 'primary.main' }}>{h.v}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Grid>
  ))}
</Grid>
```

---

## Step 9 — Summary: `SummaryTab.tsx`

- Stat cards: `<Grid container spacing={3}>` with `<Grid size={{ xs: 12, sm: 4 }}>` items
- Each stat: `<Paper sx={{ p: 4, position: 'relative', overflow: 'hidden' }}>` with decorative background icon (opacity: 0.05)
- Distribution section: `<Paper sx={{ p: 4 }}>` with `<LinearProgress variant="determinate" value={...} />`

---

## MUI v9 Pitfalls

1. **Grid `size` prop** — Use `size={{ xs: 12 }}` not `xs={12}`. No `item` prop.
2. **`cssVariables` mode** — Do NOT enable. Keep classic mode (default).
3. **`Paper elevation={0}`** — Always 0; non-zero adds MUI box-shadow conflicting with theme glassmorphism.
4. **`Collapse` inside `<table>`** — Never wrap `<tr>` in `Collapse` (renders a `<div>`). The session games area is in a `<div>`, not `<tbody>`, so this is fine.
5. **`Tabs` value type** — `Tab value` accepts strings; cast as `Tab` type from `App.tsx`.
6. **`backdropFilter` override** — The theme sets `blur(8px)` on all `Paper`. Auth card needs `blur(20px)` — pass explicit `sx={{ backdropFilter: 'blur(20px)' }}`.

---

## Verification

1. `npm run dev` — app loads, background image visible, header shows dark green glassmorphism
2. Auth screen — login/register toggle works, TextField styling matches design, errors show via `Alert`
3. Tracker tab — sessions expand/collapse, player Chips render, Add Game button works
4. Desktop — table with Select/TextField/Checkbox controls in cells, notes row expands
5. Mobile (resize to <768px) — GameCardMobile renders with Chip badges, edit mode works
6. Reference tab — Grid layout with 3 columns on desktop → 2 → 1
7. Summary tab — Stat cards + LinearProgress bars animate
8. `npm run build` — TypeScript + Vite build passes with no errors
