# Stage 1: Build the Angular SSR application
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the shop application
RUN npx nx build shop --configuration=production

# Stage 2: Production image
FROM node:22-alpine AS production

LABEL org.opencontainers.image.source="https://github.com/MintPlayer/karnaugh-map-app"

WORKDIR /app

# Copy package files for production dependencies
COPY --from=build /app/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the built application
COPY --from=build /app/dist/apps/shop ./

ENV HOST=0.0.0.0
ENV PORT=4000

EXPOSE 4000

CMD ["node", "server/server.mjs"]
