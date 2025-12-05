# --- Build stage ---
FROM node:20-slim AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm ci

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# --- Production stage ---
FROM node:20-slim

WORKDIR /app

# Instalar dependencias mínimas de sistema (openssl es útil para Prisma/NestJS)
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copiar package files
COPY package*.json ./

# Instalar SOLO dependencias de producción
# Al usar 'slim', sharp descarga binarios listos y NO necesita node-gyp ni rebuild
RUN npm ci --only=production

# Copiar el build desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Crear directorios para uploads (igual que tu configuración original)
RUN mkdir -p uploads/thumbnails && \
    chmod -R 777 uploads

# Exponer puerto
EXPOSE 3008

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3008

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3008/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Iniciar aplicación
CMD ["node", "dist/main"]