# TapBeats Active Context

## Current State

**Phase**: Initial planning and documentation complete
**Sprint**: Pre-development -- setting up memory bank and project infrastructure
**Last Updated**: 2026-03-12

---

## Active Work

- Memory bank initialization (quick-start, progress, activeContext, decisions files)
- Project README creation
- Establishing session workflows and development patterns

---

## Next Actions

1. **Begin Milestone 1: Project Scaffolding & Infrastructure**
   - Initialize Vite + React + TypeScript project
   - Configure ESLint + Prettier
   - Set up Vitest with initial test infrastructure
   - Create CI/CD pipeline (GitHub Actions)
   - Build app shell with screen routing
   - Implement design system CSS foundation (tokens, dark/light theme)
   - See: `releases/mvp/milestone-1-project-scaffolding.md`

2. **Finalize project infrastructure**
   - Complete memory bank setup (toc.md, remaining files)
   - Establish branching strategy and PR workflow

---

## Open Questions

- **License selection**: Open source, specific license TBD
- **Hosting platform**: Deployment target not yet decided (Vercel, Netlify, GitHub Pages, etc.)
- **Contributing guidelines**: Format and process to be defined before launch

---

## Recent Decisions

All architectural decisions captured in `memory-bank/decisions.md`:
- Web-first PWA, client-only, no server
- AudioWorklet for real-time onset detection
- K-means with auto-k for sound clustering
- Zustand for state management
- Canvas 2D for timeline rendering
- Pure-JS DSP (no WASM for v1)

---

## Context Notes

- PRD is comprehensive (17,500+ lines) -- always check section docs before implementing
- MVP is 10 milestones over 12 weeks, strictly sequential (each builds on previous)
- Milestone 7 (Timeline & Playback) is the first end-to-end "magic moment" checkpoint
- iOS Safari AudioWorklet support is a known risk -- ScriptProcessorNode fallback planned
