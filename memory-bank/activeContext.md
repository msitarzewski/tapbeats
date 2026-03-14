# TapBeats Active Context

## Current State

**Phase**: Post-launch UX improvements — Navigation, session persistence, playback fixes.
**Sprint**: Navigation + session restore + playback fixes on `feature/app-navigation`
**Branch**: `feature/app-navigation` (from `fix/qa-touchups`)
**Last Updated**: 2026-03-13

---

## Active Work

- Milestones 1–9: **COMPLETE** (see `progress.md` for details)
- v1.0.0: **LIVE** at tapbeats.zerologic.com

### Navigation System (this branch)
- **BottomNav**: Mobile tab bar (56px) + desktop side rail (64px), 4 tabs
- **RouteAnnouncer**: `aria-live="polite"` for screen reader route changes
- **AppShell**: Route-aware padding, desktop margin-left for side rail
- **Back buttons**: Hidden on desktop where side rail handles navigation
- **Timeline escape**: Home button in QuantizationControls (mobile only)
- **Z-index scale**: Formalized in theme.css tokens

### Session Persistence (this branch)
- **useSessionRestore**: Reads `lastSessionId` from localStorage, restores from IndexedDB on startup
- **PlaybackEngine eager init**: Loads all 18 samples at app startup, not lazily per-screen
- **Auto-session ID**: Timeline creates session ID on entry so auto-save works immediately
- **SessionCard visibility**: Fixed `opacity: 0` animation bug — cards were invisible on page load

### Playback Fixes (this branch)
- **First hit plays**: Scheduler comparison changed `>` to `>=` (first hit at time 0 was skipped)
- **Hits start at beat 1**: quantizeHits normalizes times so first hit is at time 0

### Known Issue: Session data not persisting across reloads
- Auto-save fires but saves empty state — session ID created before stores have data
- Session restore loads from IDB but sessions contain 0 hits/clusters
- Root cause under investigation: timing of auto-save vs store population
- Possibly related to nav tabs allowing direct route access before pipeline completes

---

## Next Actions

1. **Debug session persistence**: Why auto-save captures empty state
2. **Test full flow**: Record → Review → Timeline → reload → verify restore
3. **Push and merge PR** once verified
4. **Deploy** to production

---

## Context Notes

- PlaybackEngine now initializes eagerly via `useSessionRestore` — no more lazy init on ClusterScreen/TimelineScreen
- `useSessionRestore` runs in `AppRoutes` component (inside BrowserRouter, before routes render)
- localStorage key `tapbeats-last-session` tracks current session ID for restore
- HomeScreen shows "New Session" button (resets all stores) when sessions exist, RecordButton when none
