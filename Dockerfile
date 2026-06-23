FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci

FROM deps AS build
ENV NODE_ENV=development
COPY . .
RUN npm run build

FROM base AS api
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server ./server
COPY scripts ./scripts
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD npm run healthcheck
CMD ["npm", "run", "start"]

FROM nginx:1.27-alpine AS frontend
COPY nginx/frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1/healthz || exit 1
