# Docker Deployment - Quick Start

This is a React Native (Expo) web application configured for production deployment using Docker.

## For Coolify Users

Simply point Coolify to this repository and configure:

- **Dockerfile**: `Dockerfile.prod`
- **Port**: `80`
- **Auto Deploy**: Enabled

See [COOLIFY_DEPLOYMENT.md](./COOLIFY_DEPLOYMENT.md) for detailed instructions.

## For Other Deployments

### Quick Deploy

```bash
# Build and run
docker build -f Dockerfile.prod -t youpreacher-web .
docker run -p 80:80 youpreacher-web

# Or use docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### NPM Scripts

```bash
npm run docker:build      # Build Docker image
npm run docker:run        # Run container
npm run docker:prod       # Start with docker-compose
npm run docker:prod:stop  # Stop docker-compose
```

## Environment Variables

Create a `.env.production` file (see `env.production.example`):

```env
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
EXPO_PUBLIC_API_URL=https://your-api.com
```

## What's Included

- ✅ Multi-stage Docker build (optimized for size)
- ✅ Nginx web server with optimized configuration
- ✅ Gzip compression
- ✅ Static asset caching
- ✅ Security headers
- ✅ Health checks
- ✅ SPA routing support
- ✅ ~50MB final image size

## Documentation

- [COOLIFY_DEPLOYMENT.md](./COOLIFY_DEPLOYMENT.md) - Coolify deployment guide
- [DOCKER_PRODUCTION.md](./DOCKER_PRODUCTION.md) - Complete Docker documentation

## Tech Stack

- **Framework**: Expo (React Native Web)
- **Runtime**: Node.js 20 (Alpine Linux)
- **Web Server**: Nginx (Alpine Linux)
- **Build Tool**: Metro bundler
- **Container**: Multi-stage Docker build

