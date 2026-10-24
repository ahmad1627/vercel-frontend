FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm ci && npm --prefix frontend ci
COPY api ./api
COPY backend ./backend
COPY frontend ./frontend
RUN npm --prefix frontend run build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production REQUIRE_REDIS=true PORT=5000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/api ./api
COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist
EXPOSE 5000
CMD ["node", "backend/server.js"]
