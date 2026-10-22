# ==========================================
# Stage 1: Build React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Python Backend
# ==========================================
FROM python:3.11-slim AS production
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install system dependencies if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy backend source code
COPY backend/ ./backend/

WORKDIR /app/backend

EXPOSE 8000

# Start Uvicorn bound to 0.0.0.0 and dynamic cloud $PORT
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
