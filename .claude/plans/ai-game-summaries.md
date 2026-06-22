# Plan: Complete AI Game Summary Endpoint + Frontend Display

## Context

The backend has a new AI layer (`server/service/ai/`) with Claude, GPT, and Gemini integrations. The `summarizeGames` endpoint at `GET /game/summary` was scaffolded in `api.controller.ts` but is incomplete: game records are never fetched, the AI call is not awaited, and the response is never sent to the client.

The goal is to complete this endpoint and display the AI-generated HTML summary at the top of the Tracker tab, with a Gemini-inspired animated gradient wave while the response is loading.

---

## 1. Backend — `server/controller/api.controller.ts`

Replace the body of `summarizeGames` (lines 199–215):

1. Get `userId` from `req.session.user.oid`
2. Fetch records: `await this.gameService.getByUser(userId)` → `data: GameRecord[]`
3. **Early return** if no records: `res.send(new ApiResponse(true, '<p>No games played yet...</p>'))`
4. Extract unique player IDs from `records.flatMap(r => r.players.map(p => p.userId))`
5. Fetch user names: `await this.authService.getUsersByOids(playerIds)` → build `nameMap: Record<string, string>` using `firstName + ' ' + lastName` if available, else `username` (from `UserSummary` in `model/user.model.ts`)
6. Format each `GameRecord` as readable text:
   ```
   Game on {date}:
     - {playerName} (WINNER|lost): {category} — "{hand}", {jokers} jokers, score: {score}
   ```
7. `await this.aiService.getTextCompletions(messages, { model: 'claude-opus-4-7' }, userId)`
8. Extract content: `result.data?.[0]?.message?.content` — confirmed shape at `claude.service.ts:178`
9. `res.send(new ApiResponse(result.success, summary))`

Update the system prompt to add: "Use only inline styles. Return a content fragment only — no DOCTYPE, html, head, or body tags."

---

## 2. Frontend Service — `src/services/game.service.ts`

Add `getSummary()` following the same pattern as `getAll()`:

```typescript
async getSummary(): Promise<{ summary: string; error?: string }> {
  try {
    const res = await this.get<ApiResponse<string>>('/game/summary');
    if (res.success && res.data) return { summary: res.data };
    return { summary: '', error: res.msg ?? 'Failed to load summary' };
  } catch {
    return { summary: '', error: 'Unable to connect, please try again' };
  }
}
```

---

## 3. New Component — `src/components/AiSummary.tsx`

Props: `{ summary: string | null; loading: boolean }`

**Behavior:**
- Returns `null` when `!loading && !summary` (before user logs in / on error)
- **Loading state:** Gemini-style animated gradient wave using `keyframes` from `@emotion/react`:
  - "Analyzing your games with AI…" label in muted text
  - 6px tall rounded bar with animated `linear-gradient(90deg, #4285F4, #9B72CB, #D96570, #9B72CB, #4285F4)` using `background-position` keyframe (200% → -200% over 2s linear infinite)
- **Loaded state:** `dangerouslySetInnerHTML={{ __html: summary }}` in a styled Box
- Wrap both states in a glass-card matching app aesthetic: `rgba(255,255,255,0.88)` bg, `1rem` border-radius, `backdropFilter: blur(8px)`, `border: 1px solid rgba(242,171,164,0.35)`, `mb: 3`

---

## 4. App State — `src/App.tsx`

Add two new state variables alongside existing state (after line 77):
```typescript
const [aiSummary, setAiSummary] = useState<string | null>(null);
const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
```

Inside the `useEffect` at line 88 (after `if (!user) return`), fire the summary request **independently** of the `Promise.all` so sessions/records load at full speed:
```typescript
setAiSummaryLoading(true);
gameService.getSummary().then(({ summary }) => {
  setAiSummary(summary || null);
  setAiSummaryLoading(false);
});
```

Pass new props to `<TrackerTab>` (lines 243–257):
```tsx
aiSummary={aiSummary}
aiSummaryLoading={aiSummaryLoading}
```

---

## 5. TrackerTab — `src/components/TrackerTab.tsx`

Add to `TrackerTabProps` interface:
```typescript
aiSummary?: string | null;
aiSummaryLoading?: boolean;
```

Add to destructured props in the function signature.

Import `AiSummary` and render it **between the Button Box (line 60) and the `<Stack>` (line 62)**:
```tsx
<AiSummary summary={aiSummary ?? null} loading={!!aiSummaryLoading} />
```

---

## Critical File References

| File | Key Location |
|------|-------------|
| `server/controller/api.controller.ts` | `summarizeGames` at line 198 |
| `server/service/ai/claude.service.ts` | Response shape at line 178: `data[0].message.content` |
| `src/App.tsx` | Data `useEffect` at lines 88–102 |
| `src/components/TrackerTab.tsx` | Injection point between lines 60–62 |
| `model/user.model.ts` | `UserSummary` fields: `oid`, `username`, `firstName?`, `lastName?` |

---

## Verification

1. Start the backend (`server/monolith.app.ts` or Lambda local dev)
2. `npm run dev` for frontend
3. Log in with a user that has game records → Tracker tab should immediately show the Gemini wave animation
4. After 3–10s the wave is replaced by the AI-generated HTML summary
5. Sessions and games remain visible below, unaffected
6. Log in with a new user (no records) → summary shows "No games played yet" HTML message
7. No regressions on other tabs (Hands Reference, Summary stats)
