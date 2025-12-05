# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para compilar sharp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    pkgconfig

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias de runtime para sharp
RUN apk add --no-cache \
    vips-dev \
    vips

# Copiar package files
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production --ignore-scripts && \
    npm rebuild sharp --ignore-scripts=false

# Copiar build desde builder stage
COPY --from=builder /app/dist ./dist

# Crear directorios para uploads con permisos correctos
RUN mkdir -p uploads/thumbnails && \
    chmod -R 777 uploads

# Exponer puerto
EXPOSE 3008

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3008

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3008/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Iniciar aplicación
CMD ["node", "dist/main"]
