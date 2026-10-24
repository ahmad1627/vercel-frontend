FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY frontend/package*.json ./frontend/
RUN npm --prefix frontend ci
COPY . .
RUN npm --prefix frontend run build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=5000
COPY package*.json ./
RUN npm ci --omit=dev
COPY backend/src ./backend/src
COPY backend/server.js ./backend/server.js
COPY api ./api
COPY --from=build /app/frontend/dist ./frontend/dist
USER node
EXPOSE 5000
CMD ["node", "backend/server.js"]
