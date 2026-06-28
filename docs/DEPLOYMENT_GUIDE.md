# Deployment Guide

## Backend

1. Provision MongoDB Atlas or a managed MongoDB database.
2. Configure production env vars:

```txt
NODE_ENV=production
PORT=5000
MONGODB_URI=<mongodb-uri>
CLIENT_ORIGIN=https://your-frontend.example.com
TRUST_PROXY=true
JWT_SECRET=<32+ character secret>
JWT_EXPIRES_IN=12h
PASSWORD_PEPPER=<32+ character pepper>
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
ALLOW_PRODUCTION_SEED=false
```

3. Deploy the Node server with `npm start`.
4. Health checks:

```txt
GET /api/health
GET /api/ready
```

## Frontend

Set these during the frontend build:

```txt
VITE_API_BASE_URL=https://your-api.example.com/api
VITE_SOCKET_URL=https://your-api.example.com
```

If the frontend and backend are served from the same origin, the app falls back to `/api` and the current origin for sockets.

## CORS

`CLIENT_ORIGIN` is a comma-separated allow-list:

```txt
CLIENT_ORIGIN=https://app.example.com,https://demo.example.com
```

Do not use `*` with credentials.

## Security Checklist

- Use HTTPS only.
- Use strong `JWT_SECRET` and `PASSWORD_PEPPER`.
- Keep `JWT_EXPIRES_IN` short enough for production, such as `12h`.
- Keep `ALLOW_PRODUCTION_SEED=false`.
- Limit MongoDB network access to trusted hosts.
- Configure Cloudinary credentials only in the backend environment.
- Review audit logs after demo data import.

## Build

```bash
npm install
npm run lint
npm run build
npm start
```
