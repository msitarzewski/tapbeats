# TapBeats Active Context

## Current State

**Phase**: Milestone 1 complete. Ready for Milestone 2.
**Sprint**: Implementation — audio capture pipeline
**Last Updated**: 2026-03-12

---

## Active Work

- Milestone 1: Project Scaffolding & Infrastructure — **COMPLETE** (commit `34680be` on `milestone-1/scaffolding`)
- All 10 milestone docs updated with M1 lessons learned

---

## Next Actions

1. **Begin Milestone 2: Audio Capture & Microphone Pipeline**
   - `getUserMedia` with correct constraints (no echo cancel, no noise suppress, no AGC)
   - AudioWorklet capture processor in `public/worklets/`
   - Ring buffer for audio data transfer
   - Recording UI: live waveform, level meter, countdown timer
   - `recordingStore` Zustand slice
   - See: `releases/mvp/milestone-2-audio-capture.md`

2. **Merge milestone-1/scaffolding to main**
   - User review of M1 work
   - Merge feature branch

3. **Create GitHub remote repository**

---

## Open Questions

- **License selection**: Open source, specific license TBD
- **Hosting platform**: Deployment target not yet decided (Vercel, Netlify, GitHub Pages, etc.)
- **GitHub remote**: Repository not yet created on GitHub

---

## Recent Decisions

- **Port 8087, no SSL**: Dev server runs HTTP on localhost:8087. SSL removed (`@vitejs/plugin-basic-ssl` dropped). `getUserMedia` works on localhost without HTTPS.
- **ui-design.md Appendix A is canonical**: CSS tokens use Appendix A names (`--bg-primary`, `--accent-primary: #FF6B3D`), not the older milestone-1 spec names.
- **tsconfig.test.json**: Separate tsconfig for test files — main `tsconfig.json` excludes `tests/`, test tsconfig includes them with relaxed rules.
- All prior architectural decisions remain in `memory-bank/decisions.md`.

---

## Context Notes

- PRD is comprehensive (17,500+ lines) — always check section docs before implementing
- MVP is 10 milestones over 12 weeks, strictly sequential (each builds on previous)
- Milestone 7 (Timeline & Playback) is the first end-to-end "magic moment" checkpoint
- iOS Safari AudioWorklet support is a known risk — ScriptProcessorNode fallback planned
- All milestones now have "Implementation Notes from M1" sections with TypeScript/lint gotchas
