# ---- 1. build the static site ----
FROM node:22-alpine AS build
# not /app: the site has an app/ page, and Vite mixes up /app/app/index.html with /app/index.html
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# public/ files keep the host's file mode; make dist readable by the nginx worker
RUN npm run build && chmod -R a+rX dist

# ---- dev: Vite with hot reload (docker compose --profile dev up dev) ----
FROM node:22-alpine AS dev
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# ---- API server: accounts, roles, workspaces and the audit log in PostgreSQL (or SQLite) ----
# only the server's one dependency is installed (pg, pinned to the version in package-lock.json)
FROM node:24-alpine AS sync
WORKDIR /app
RUN npm install --no-save --no-audit --no-fund pg@8.23.1
COPY --chmod=0444 server/server.mjs server/kev-bundled.json ./
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 8787
CMD ["node", "server.mjs"]

# ---- 2. runtime (default target): nginx serves the built files and proxies /api/ to the API server ----
FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:80/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
