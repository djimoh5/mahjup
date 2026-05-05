# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Constitution

MahjUp is an AI-powered mahjong game tracker that helps you improve your game over time. By tracking the outcomes of every game of Mahj you play, an analyzer can learn which strategies have been working for you and provide tips for improvement.

Users can also create a Mahj Session, a scheduled time of the day or event, where a group of individuals decide they would like to play one or more Mahj games. This allows friends playing together to share results and benefit from shared learnings.

## Commands

### Frontend (root)

```bash
npm run dev        # Start Vite dev server
npm run build      # tsc + vite build
npm run preview    # Preview production build
npm run lint       # ESLint
```

### Backend (`core/`)

```bash
cd core && npm install   # Install backend deps separately
```

The backend has no standalone run script in package.json — it is deployed as an AWS Lambda function (via `serverless-http`) or as a standalone Express server via `core/server.ts`.

## Architecture

This is a two-part TypeScript application:

### Frontend (`src/`)

A React 18 SPA built with Vite for tracking Mahjong game statistics.

- [src/App.tsx](src/App.tsx) — root component, owns all state (game records, active tab), persists to `localStorage` with debounced auto-save
- [src/data/hands.ts](src/data/hands.ts) — static 2026 NMJL Official Rules hand reference data (8 categories, ~170 hands)
- [src/components/](src/components/) — four tabs: `TrackerTab` (game log), `ReferenceTab` (hand lookup), `SummaryTab` (stats), `GameRow` (row editor)

State shape: `GameRecord[]` stored in `localStorage`. No external API calls from the frontend — it is fully offline-capable.

### Backend (`core/`)

An Express.js API designed for dual deployment: AWS Lambda (primary) and monolith Express server (fallback).

**Entry points**

- [core/app.ts](core/app.ts) — exports the Express `app` instance used by Lambda
- [core/monolith.app.ts](core/monolith.app.ts) — alternate entry for non-Lambda hosting
- [core/server.ts](core/server.ts) — wires routes, MongoDB, and static content serving

**Layers**

| Directory          | Role                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `core/config/`     | Multi-environment config (base/QA/sprint/release), AWS Secrets Manager integration, RSA key pair |
| `model/`           | TypeScript interfaces for domain objects (user, auth, email, job, privilege, error)              |
| `core/service/`    | Business logic — auth (JWT + bcrypt), email (Mandrill), S3, CloudFront, HTTP                     |
| `core/repository/` | MongoDB data access layer                                                                       |
| `core/controller/` | Express request handlers                                                                         |
| `core/router/`     | Route definitions                                                                                |
| `core/jobs/`       | Async/scheduled background tasks                                                                 |
| `core/deploy/`     | AWS Lambda handler and build-version artifacts                                                   |


**Coding Patterns and Naming Conventions**

All MongoDB collection names defined in repositories should be singular. E.g. do not user "game_records", instead it should be "game_record".

Repository names should mirror their underlying collection name. However, when using multiple words, MongoDB collections should use underscores, while repository names should use hypens. E.g. collection name = `mahj_session` and repository name =  `mahj-session.repository.ts`

**DI**: The backend uses `injection-js` for dependency injection, bootstrapped in [core/config/bootstrap.ts](core/config/bootstrap.ts).

**Auth**: RS256 JWT (RSA key pair in `core/config/`), passwords hashed with bcrypt.

**Database**: MongoDB via the official Node driver (not Mongoose).

### Key config files

- [vite.config.ts](vite.config.ts) — Vite + React plugin
- [tsconfig.json](tsconfig.json) — frontend TS (target ES2020, JSX)
- [core/config/](core/config/) — environment-specific JSON configs (do not commit secrets)
