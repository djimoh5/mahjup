# Plan: Mobile Card UI for TrackerTab

## Context
TrackerTab uses an inline-editable table (`overflow-x: auto`) which works fine on desktop but is cramped and scroll-heavy on mobile — the primary use device. The fix is a responsive split: below 768px, replace the table with a card list where each card shows a compact summary and has a pencil icon to enter a stacked edit mode. Desktop behavior is completely unchanged.

---

## Files to Create

### `src/hooks/useIsMobile.ts` (new)
Uses `window.matchMedia` (fires only on threshold crossings, not every pixel) to return `true` when viewport < 768px. Initial state is lazily evaluated so it is correct on first render.

```ts
import { useState, useEffect } from 'react';
const BREAKPOINT = 768;
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < BREAKPOINT);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}
```

### `src/components/GameCardMobile.tsx` (new)
Props match `GameRow` exactly: `{ record, onUpdate, onDelete }`.

**Local state:** `const [isEditing, setIsEditing] = useState(false)` — purely UI, no data to lift.

**Summary view** (default):
- Flex row: date · category+hand (truncated) · WIN/LOSS pill badge · score badge · pencil button

**Edit view** (when `isEditing`):
- Vertically stacked labeled fields: Date → Category → Hand → Result → Score (read-only badge) → Opponents → Notes
- Replicates `handleCategoryChange` / `handleHandChange` / notes `skipSave` blur pattern from `GameRow` exactly
- Footer: Delete button (left) + Done/checkmark button (right, calls `setIsEditing(false)`)
- Hand select gets `disabled={!record.category}` to prevent invalid state (mobile users more likely to try out-of-order)

**Score badge in summary:** hidden when `record.score === 0` to avoid noise on new/empty entries.

---

## Files to Modify

### `src/components/TrackerTab.tsx`
Add `useIsMobile` hook and conditional render:

```tsx
const isMobile = useIsMobile();

// Replace the table-wrapper block with:
{isMobile ? (
  <div className="card-list-mobile">
    {records.map(record => (
      <GameCardMobile key={record.oid} record={record}
        onUpdate={(patch, skipSave) => onUpdate(record.oid, patch, skipSave)}
        onDelete={() => onDelete(record.oid)} />
    ))}
  </div>
) : (
  <div className="table-wrapper">
    <table className="custom-table">...</table>  {/* unchanged */}
  </div>
)}
```

### `src/styles.css`
Append new CSS blocks (no media query wrapper needed — component is conditionally mounted):

| Class | Purpose |
|---|---|
| `.card-list-mobile` | Flex column, gap 0.5rem |
| `.mc-card` | White card with border-radius, `var(--card-bg)` + `var(--border)` |
| `.mc-card--editing` | Coral border + shadow modifier |
| `.mc-summary` | Flex row, padding 0.625rem 0.875rem |
| `.mc-summary-date` | 0.6875rem, muted, min-width 5.5rem |
| `.mc-summary-hand` | Flex 1, truncated with ellipsis |
| `.mc-wl-badge`, `--win`, `--loss` | Pill badge, green or red tints |
| `.mc-pencil-btn` | Icon-only button, muted → coral on hover |
| `.mc-edit-body` | Flex column, gap 0.75rem, border-top |
| `.mc-field` | Flex column with label+input, gap 0.25rem |
| `.mc-label` | 0.625rem caps, muted, letter-spacing |
| `.mc-edit-footer` | Space-between row with delete + done |
| `.mc-done-btn` | Coral `.btn-primary`-style button with checkmark SVG |

Reuse existing `.row-input`, `.row-notes`, `.row-score-badge`, `.delete-btn` inside the edit body — no duplication.

---

## Summary vs Edit Mode Fields

| Field | Summary | Edit |
|---|---|---|
| Date | Abbreviated display | `<input type="date">` |
| Category | Prepended to hand (muted) | `<select>` |
| Hand | Truncated with ellipsis | `<select>` (disabled if no category) |
| Result | WIN/LOSS pill | `<select>` WIN/LOSS |
| Score | Badge (hidden if 0) | Read-only badge |
| Opponents | Hidden | `<input type="text">` |
| Notes | Hidden | `<textarea>` (skipSave on change, save on blur) |
| Pencil button | Shown | Hidden |
| Done + Delete | Hidden | Shown in footer |

---

## Implementation Order
1. `src/hooks/useIsMobile.ts` — no deps on new code
2. `src/components/GameCardMobile.tsx` — depends on `handData` + `GameRecord` (both existing)
3. `src/styles.css` — no code deps
4. `src/components/TrackerTab.tsx` — depends on steps 1 & 2

---

## Verification
1. `npm run dev` — start dev server
2. Open browser DevTools, set viewport to iPhone 375px wide — confirm card list renders, pencil opens stacked form, all fields editable, auto-save fires, Done collapses card
3. Set viewport to 800px — confirm table view is intact and unchanged
4. Add a new record on mobile, edit each field, confirm data persists after page reload
5. `npm run build` — confirm no TypeScript errors
