# Team Task Manager

A full-stack project and task management app with authentication, project teams, role-based access control, task assignment, status tracking, and a responsive dashboard.

## Stack

- Frontend: React, Vite, CSS, Lucide icons
- Backend: Node.js, Express
- Database: PostgreSQL
- Auth: JWT + bcrypt password hashing
- Validation: Zod
- Deployment: Railway

## Local Setup

1. Create or open a Railway PostgreSQL database.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to Railway's public PostgreSQL URL.
3. Install dependencies:

```bash
npm install
```

4. Run migrations and optional demo seed:

```bash
npm run db:migrate
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

The API runs on `http://localhost:5000` and the frontend on `http://localhost:5173`.
In development, Vite proxies `/api` calls to the Express server, so start the app with `npm run dev`.

## Demo Seed Login

- Admin: `admin@example.com` / `Admin@12345`
- Member: `member@example.com` / `Member@12345`

## Railway Deployment

1. Push this repository to GitHub.
2. Create a Railway project from the GitHub repository.
3. Add a PostgreSQL service in Railway.
4. Add environment variables:
   - `DATABASE_URL` from Railway PostgreSQL
   - `JWT_SECRET` as a long random value
   - `NODE_ENV=production`
5. Deploy. `railway.json` runs install, build, migrations, and starts the server.

## API Overview

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `POST /api/projects/:projectId/members`
- `DELETE /api/projects/:projectId/members/:userId`
- `POST /api/projects/:projectId/tasks`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`
