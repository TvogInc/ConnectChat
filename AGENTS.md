# ConnectChat

## Overview
ConnectChat is a real-time chat application built with React + Vite (frontend) and Node.js + Express + Socket.IO (backend), with PostgreSQL and Redis.

## Architecture
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS, served on port 5173 (mapped to host 3000)
- **Backend**: Node.js + Express + TypeScript + Socket.IO, served on port 4000 (internal, proxied through Vite)
- **Database**: PostgreSQL 16 (Prisma ORM)
- **Cache/Real-time**: Redis 7 (Socket.IO Redis adapter)

## Running
```
docker compose -f docker-compose.base44.yml up -d --build
```
The app is available at http://localhost:3000.

## Key Details
- Vite proxies `/api/*` and `/socket.io/*` to the backend (single-origin setup)
- Backend uses `tsx watch` for hot reload; frontend uses Vite's built-in HMR
- Prisma schema is pushed with `db push` on backend startup; seed runs automatically
- JWT auth with Bearer token in `Authorization` header
- Demo accounts seeded: alice@example.com / password123, bob@example.com, carol@example.com, dave@example.com

## Secrets
- `JWT_SECRET` — required at boot, generated as dev placeholder

## Tech Stack
- Frontend: React 18, Vite 5, TypeScript, Tailwind CSS 3, Socket.IO client, React Router 6
- Backend: Express 4, Prisma 5, Socket.IO 4, bcryptjs, jsonwebtoken, Redis adapter
- Infra: PostgreSQL 16, Redis 7
