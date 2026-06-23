# Nexus Production Deployment Guide

This guide prepares Nexus Student Management System for production using:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Assets/Documents: Cloudinary
- Optional self-hosted stack: Docker Compose + NGINX + HTTPS

## 1. Environment Variables

Use `.env.production.example` as the source of truth.

Backend variables:

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/nexus-student-management?retryWrites=true&w=majority
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
TRUST_PROXY=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
LOG_LEVEL=info
MONGO_MAX_POOL_SIZE=20
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_DOCUMENT_FOLDER=nexus/student-documents
MAX_DOCUMENT_UPLOAD_MB=10
```

Frontend variables:

```bash
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
VITE_SOCKET_URL=https://your-render-service.onrender.com
```

## 2. MongoDB Atlas

1. Create an Atlas project and M10+ production cluster.
2. Create a database user with least privilege for the Nexus database.
3. Add Render outbound IPs or use Atlas private networking if available.
4. Enable automated Atlas backups with point-in-time restore.
5. Store the Atlas connection string in Render as `MONGODB_URI`.

Recommended indexes are declared in Mongoose schemas for students, documents, notifications, and audit logs.

## 3. Backend on Render

Use `render.yaml` or configure manually:

- Runtime: Node
- Build command: `npm ci --omit=dev`
- Start command: `npm run start`
- Health check path: `/api/ready`
- Environment: production

Important production settings:

- `TRUST_PROXY=true`
- `CLIENT_ORIGIN=https://your-vercel-app.vercel.app`
- `LOG_LEVEL=info`
- Cloudinary credentials set as secret env vars

Render deploy hook:

1. Create a Render deploy hook.
2. Add it to GitHub secrets as `RENDER_DEPLOY_HOOK_URL`.
3. Use `.github/workflows/deploy-render.yml`.

## 4. Frontend on Vercel

Use `vercel.json`.

Set Vercel environment variables:

```bash
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
VITE_SOCKET_URL=https://your-render-service.onrender.com
```

GitHub secrets needed for CI/CD:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

The Vite build already uses route-level lazy loading and manual vendor chunks for React, Radix, TanStack Query, Motion, Lucide icons, and shared vendor code.

## 5. Docker Deployment

Build and run the local production stack:

```bash
cp .env.production.example .env.production
docker compose up --build
```

Services:

- `mongo`: local MongoDB for non-Atlas environments
- `api`: Express + Socket.io API
- `frontend`: static Vite build served by NGINX
- `nginx`: reverse proxy and TLS termination
- `backup`: on-demand MongoDB backup profile
- `certbot`: initial certificate generation profile

Run an on-demand backup:

```bash
docker compose --profile backup run --rm backup
```

## 6. NGINX and HTTPS

`nginx/nginx.conf` includes:

- HTTP to HTTPS redirect
- TLS 1.2 / 1.3
- HSTS
- security headers
- API rate limiting
- WebSocket proxy support for Socket.io
- static frontend proxying

Before using it, replace:

- `nexus.example.com`
- `api.nexus.example.com`
- certificate paths if your domains differ

Initial certificate flow:

```bash
docker compose up -d nginx
docker compose --profile tls run --rm certbot
docker compose restart nginx
```

For renewals, schedule:

```bash
docker compose --profile tls run --rm certbot renew
docker compose restart nginx
```

## 7. Security

Implemented server protections:

- Helmet security headers
- CORS allow-list
- rate limiting
- JSON body size limit
- disabled `x-powered-by`
- proxy-aware deployment mode
- structured error handling
- Cloudinary upload validation
- audit logging middleware

Before production launch:

- Replace demo `requestContext` middleware with JWT/session authentication.
- Store secrets only in Render/Vercel/Atlas secret managers.
- Use private networking where available.
- Enable Atlas backup and alerting.
- Rotate Cloudinary and database credentials on a schedule.

## 8. Logging and Monitoring

Logging:

- Backend uses Winston and Morgan.
- Render captures stdout/stderr logs.
- Use `LOG_LEVEL=info` in production.

Recommended monitoring:

- Render health checks on `/api/ready`
- UptimeRobot, Better Stack, or Grafana Cloud for external uptime checks
- MongoDB Atlas alerts for CPU, memory, connections, replication lag, storage, and backup failures
- Cloudinary usage alerts
- Vercel Web Analytics for frontend performance

Health endpoints:

- `/api/health`: process liveness
- `/api/ready`: database readiness

## 9. Backups

Primary recommendation: MongoDB Atlas automated backups with PITR.

Secondary self-hosted option:

```bash
npm run backup:mongodb
```

This runs `mongodump`, writes compressed archives to `BACKUP_DIR`, and prunes old backups using `BACKUP_RETENTION_DAYS`.

For production, schedule backups outside the app process using:

- Render cron job
- GitHub Actions scheduled workflow
- server cron
- Atlas native backups

## 10. Rollback

Frontend:

- Use Vercel deployment history and promote a previous deployment.

Backend:

- Use Render rollback to a previous deploy.
- Keep database migrations backward-compatible.

Database:

- Restore from Atlas snapshot/PITR.
- Test restore procedures quarterly.

## 11. Production Checklist

- `npm audit` returns 0 vulnerabilities or accepted exceptions.
- `npm run build` passes.
- Render `/api/ready` returns 200.
- Vercel frontend can reach API and Socket.io.
- MongoDB Atlas backups are enabled.
- Cloudinary credentials are configured.
- CORS includes only production frontend origins.
- HTTPS is active.
- Logs and alerts are configured.
- Demo auth middleware is replaced before handling real student data.
