# Notes App — Frontend

Part of the AWS/Docker/Kubernetes learning project — see `aws-notes-backend/CLAUDE.md` for the full project plan, phase roadmap, and working-style rules (those still apply here: Docker/CI files stay user-authored, application code is written normally).

## Why this repo exists ahead of Phase 7

The original plan sequenced the frontend as Phase 7, after the backend is fully deployed to AWS. It was pulled forward (2026-09-15) because the user wanted to see the backend working visually rather than only via curl, and understood the "never localhost" rule correctly: the frontend always points at whichever backend is "real" for the moment — `http://localhost:8080` now, the AWS-deployed URL once Phase 3/4 land — via a build-time env var, never hardcoded. The user has no frontend background and explicitly delegated all frontend decisions.

## Tech stack

- **Vite + React + TypeScript** — not Create React App (deprecated); this is why the env var is `VITE_API_URL`, not the `REACT_APP_API_URL` named in the original plan doc
- **Tailwind CSS v4** via `@tailwindcss/vite` (no separate config file needed for v4's default setup)
- **React Router** for client-side routing (`/login`, `/signup`, `/` protected)
- No global state library — component state + a small `AuthProvider` context is enough at this scale

## Structure

```
src/
  lib/
    types.ts    - shared TS types matching backend JSON shapes
    api.ts      - typed fetch client, one function per backend endpoint
    auth.tsx    - AuthProvider/useAuth - token in localStorage, injected as Bearer header
  components/
    NoteList.tsx, NoteEditor.tsx, TagBar.tsx, AttachmentPanel.tsx, ShareDialog.tsx
  pages/
    Login.tsx, Signup.tsx, Notes.tsx (the main two-pane workspace)
  App.tsx        - routing + route guards
```

## Backend integration notes

- CORS: the backend's `FRONTEND_URL` env var must match this app's origin (`http://localhost:5173` in dev) or requests are blocked. See `aws-notes-backend`'s `api/cors.go` and `appconfig`.
- Auth: JWT in `Authorization: Bearer <token>` header, not cookies — no CSRF concerns, no `credentials: include` needed.
- File downloads (`api.downloadAttachment`) fetch as a blob with the auth header attached, then trigger a browser download via an object URL — a plain `<a href>` can't carry the Authorization header, so this can't be a simple link.
- **Permission-aware rendering**: `GET /api/notes/shared-with-me` returns a `permission: "read"|"write"` field per note (absent on the user's own notes, which are always fully editable). `NoteEditor` derives `isOwner`/`canEdit` from this and conditionally hides Save/Delete/tag-editing/attachment-upload/Share controls for read-only shares. This was added after testing surfaced a real gap: without it, the UI offered edit controls that the backend would then reject with 403. If extending sharing further, keep this field flowing through - don't let the UI drift back to "assume owner."

## Current status (as of 2026-09-15)

All core flows built and verified in a real browser against the real backend + local Postgres: signup, login, logout, notes CRUD, tags (add/remove/dedupe), full-text search, sharing (share/revoke, read vs. write permission boundaries enforced and correctly reflected in the UI), and attachments (upload/list/delete wired — actual file upload couldn't be exercised via browser automation since it requires a native OS file picker, but the code path is identical to what was already verified against the backend via curl).

Known gaps / not yet done:
- No automated tests
- Attachment upload never verified through an actual browser file picker (only via backend curl tests)
- `docker-compose.yml` (Phase 2, bringing backend + frontend + Postgres together) not yet written — stays the user's file per the working-style rule
- No production build / deploy config yet (Phase 7.1)
