# Build admin frontend
FROM node:20 AS admin-build
WORKDIR /app/admin
COPY admin/package*.json ./
RUN npm install
COPY admin/tsconfig*.json ./
COPY admin/vite.config.ts ./
COPY admin/src ./src
COPY admin/public ./public
RUN ls -R src
RUN find src -maxdepth 3 -type f -name 'mockClubs.ts'
RUN npm run build

# Railway-optimized backend image
FROM python:3.11-slim

# Install dependencies needed at runtime
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy application files
COPY . .
# Copy built admin bundle from the Node stage
COPY --from=admin-build /app/admin/dist ./admin/dist

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || echo "No requirements.txt found"

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port (Railway will set PORT automatically)
EXPOSE $PORT

# Set default environment variables
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/ || exit 1

# Start production server
CMD ["python3", "server.py"]
