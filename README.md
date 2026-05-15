# Slimy Pals

Slimy Pals is a Vite + React pet game for summoning, feeding, and managing slime friends. The frontend supports local IndexedDB persistence through Dexie, offline-friendly domain actions, realtime friend updates, and a generated service worker for production builds.

## Setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` when connecting to an API server:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_REALTIME_URL=ws://localhost:3000/realtime
```

## Scripts

- `npm run dev` starts the Vite dev server.
- `npm run build` creates a production build in `dist/`.
- `npm run lint` runs ESLint.
- `npm run preview` serves the production build locally.

## Source Layout

```text
src/
  app/             App shell, authenticated game coordinator, app-level hooks.
  assets/          Sprites, sounds, map tiles, and UI images.
  audio/           Audio manager, sound registry, and background music hook.
  config/          Runtime and API configuration.
  domain/          Game/domain rules and slime presentation helpers.
  features/        UI feature areas such as auth, menu, notifications, and world.
  infrastructure/  API, auth session, IndexedDB, realtime, network, and sync adapters.
  styles/          Global CSS split by feature/surface.
```
