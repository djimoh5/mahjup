# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Constitution

MahjUp is an AI-powered mahjong game tracker that helps you improve your game over time. By tracking the outcomes of every game of Mahj you play, an analyzer can learn which strategies have been working for you and provide tips for improvement.

Users can also create a Mahj Session, a scheduled time of the day or event, where a group of individuals decide they would like to play one or more Mahj games. This allows friends playing together to share results and benefit from shared learnings.

## Commands

### Frontend (root)

```bash
npm run dev        # Start Vite dev server (proxies /api to localhost:8080)
npm run build      # tsc + vite build
npm run preview    # Preview production build
npm run lint       # ESLint
```

### Backend (`server/`)

```bash
cd server && npm install   # Install backend deps separately
```

The backend has no standalone run script — it is deployed as an AWS Lambda function (via `serverless-http`) or as a standalone Express server via `server/monolith.app.ts`. To compile: `tsc -p server/tsconfig.json` (outputs to `build/`).

## Architecture

This is a two-part TypeScript application. The frontend and backend share domain models from the root-level `model/` directory, which both `tsconfig.json` files include.

### Frontend (`src/`)

A React 18 SPA built with Vite for tracking Mahjong game statistics.

- [src/App.tsx](src/App.tsx) — root component, owns all state (sessions, records, users). On mount it calls three backend APIs (auth, sessions, game records, users) and keeps everything in React state. Mutations call the backend immediately and update state optimistically.
- [src/data/hands.ts](src/data/hands.ts) — static 2026 NMJL Official Rules hand reference data (8 categories, ~170 hands)
- [src/components/](src/components/) — four tabs: `TrackerTab` (session/game log), `ReferenceTab` (hand lookup), `SummaryTab` (stats); per-game editors: `GameRow` (desktop table row), `GameCardMobile` (mobile card)
- [src/services/](src/services/) — thin fetch wrappers (`base.service.ts` handles auth headers and token refresh); one service per domain (auth, game, mahj-session, user)

The Vite dev server proxies `/api/*` to `http://localhost:8080` (`vite.config.ts`). In production the API base URL comes from `VITE_API_BASE_URL`.

### Backend (`server/`)

An Express.js API designed for dual deployment: AWS Lambda (primary) and monolith Express server (fallback).

**Entry points**

- [server/app.ts](server/app.ts) — exports the Express `app` instance used by Lambda
- [server/monolith.app.ts](server/monolith.app.ts) — alternate entry for non-Lambda hosting
- [server/server.ts](server/server.ts) — `Server` class: wires routes, opens three MongoDB connections (APP, AUDIT, LOG), serves static frontend

**Layers**

| Directory           | Role                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `server/config/`    | Multi-environment config (base/QA/sprint/release), AWS Secrets Manager integration, RSA key pair |
| `model/`            | Shared TypeScript interfaces (user, auth, game, mahj-session, email, job, privilege, error)       |
| `server/service/`   | Business logic — auth (JWT + bcrypt), email (Mandrill), S3, CloudFront, HTTP                      |
| `server/repository/`| MongoDB data access layer                                                                         |
| `server/controller/`| Express request handlers                                                                          |
| `server/router/`    | Route definitions                                                                                 |
| `server/jobs/`      | Async/scheduled background tasks                                                                  |
| `server/deploy/`    | AWS Lambda handler and build-version artifacts                                                    |

**Routing pattern**: Controllers use `@Get`, `@Post`, `@Delete` decorators (defined in `server/controller/base.controller.ts`) that register handlers with `ApiFactory`. `server/router/router.ts` maps URL prefixes to controller classes, and `server/server.ts` resolves each controller via DI and mounts it.

**Coding Patterns and Naming Conventions**

All MongoDB collection names defined in repositories should be singular. E.g. do not use "game_records", instead it should be "game_record".

Repository names should mirror their underlying collection name. However, when using multiple words, MongoDB collections should use underscores, while repository names should use hyphens. E.g. collection name = `mahj_session` and repository name = `mahj-session.repository.ts`.

**DI**: The backend uses `injection-js` for dependency injection, bootstrapped in [server/config/bootstrap.ts](server/config/bootstrap.ts). Services and repositories are decorated with `@Injectable()` and `@Bootstrap()`. Resolve with `Injector.get(SomeClass)`.

**Auth**: RS256 JWT (RSA key pair in `server/config/`), passwords hashed with bcrypt. After auth the current user is available as `req.session.user` in controllers.

**Database**: MongoDB via the official Node driver (not Mongoose). `BaseRepository` in `server/repository/base.repository.ts` provides `updateObject` (upsert), `removeObject`, and audit logging for all collections.

**Session players**: `MahjSession.players` is an optional restriction list — if non-empty, only those players can be added to games in the session. Game participants do **not** propagate back up to `session.players`. Sessions are returned to a user if they are the creator, in `players`, or a participant in any game within the session.

### Key config files

- [vite.config.ts](vite.config.ts) — Vite + React plugin, `/api` proxy to port 8080
- [tsconfig.json](tsconfig.json) — frontend TS (target ES2020, ESNext modules)
- [server/tsconfig.json](server/tsconfig.json) — backend TS (target ES2017, CommonJS, outputs to `build/`)
- [server/config/](server/config/) — environment-specific configs (do not commit secrets)
