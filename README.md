# Pull Request Intelligence Platform

MVP that connects to GitHub, syncs Pull Request data, computes engineering
quality metrics, and surfaces insights per PR and per engineer.

This repository is an **npm-workspaces monorepo**.

## Structure

```
.
├── apps/
│   ├── backend/                 # Express + Prisma API
│   │   ├── prisma/
│   │   │   └── schema.prisma     # DB schema (User, Repository, Engineer, PullRequest, Review)
│   │   └── src/
│   │       ├── config/           # env loading
│   │       ├── lib/              # prisma client singleton
│   │       ├── middleware/       # error + 404 handlers
│   │       ├── modules/          # feature-based: auth, repositories, pull-requests, metrics
│   │       ├── routes/           # API router aggregation
│   │       ├── app.ts            # express app factory
│   │       └── index.ts          # server entry
│   └── frontend/                # React + Vite client
│       └── src/
│           ├── lib/              # axios instance, query client
│           ├── features/         # feature-based: auth, dashboard, repositories, pull-requests
│           ├── components/       # shared UI
│           ├── App.tsx
│           └── main.tsx
├── tsconfig.base.json           # shared compiler options
├── eslint.config.js             # root flat ESLint config
├── .prettierrc.json
└── .husky/pre-commit            # runs lint-staged
```

## Prerequisites

- Node.js 20+ (`.nvmrc`)
- PostgreSQL 14+

## Setup

```bash
npm install

# Configure environment
cp apps/backend/.env.example  apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Initialize the database
npm run prisma:generate -w @pr/backend
npm run prisma:migrate  -w @pr/backend
```

## Development

```bash
npm run dev            # backend + frontend together
npm run dev:backend
npm run dev:frontend
```

## Quality

```bash
npm run lint
npm run format
npm run typecheck
npm run build
```

Husky + lint-staged run ESLint and Prettier on staged files before each commit.
