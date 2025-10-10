# Production Docker Deployment Guide

This guide explains how to deploy the YouPreacher web application using Docker in production.

## Overview

The production Docker setup uses a multi-stage build process:
1. **Build Stage**: Compiles the Expo web app into static files
2. **Production Stage**: Serves the static files using Nginx

## Files

- `Dockerfile.prod` - Production Dockerfile with multi-stage build
- `nginx.conf` - Custom Nginx configuration with optimizations
- `docker-compose.prod.yml` - Docker Compose configuration for production
- `.dockerignore` - Files to exclude from Docker build context

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and start the container
npm run docker:prod

# Stop the container
npm run docker:prod:stop
```

### Option 2: Using Docker CLI

```bash
# Build the image
npm run docker:build

# Run the container
npm run docker:run
```

### Option 3: Manual Docker Commands

```bash
# Build the Docker image
docker build -f Dockerfile.prod -t youpreacher-web:latest .

# Run the container
docker run -d -p 80:80 --name youpreacher-web youpreacher-web:latest

# Stop the container
docker stop youpreacher-web

# Remove the container
docker rm youpreacher-web
```

## Configuration

### Port Mapping

By default, the application runs on port 80. To use a different port:

```bash
# Run on port 8080 instead
docker run -d -p 8080:80 youpreacher-web:latest
```

Or modify `docker-compose.prod.yml`:

```yaml
ports:
  - "8080:80"  # Change 8080 to your desired port
```

### Environment Variables

To add environment variables, create a `.env.production` file:

```bash
REACT_APP_API_URL=https://api.youpreacher.com
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
```

Then modify `docker-compose.prod.yml`:

```yaml
services:
  web:
    env_file:
      - .env.production
```

### Custom Nginx Configuration

The `nginx.conf` file includes:
- Gzip compression for better performance
- Security headers
- Static asset caching (1 year for immutable files)
- SPA routing support (all routes serve index.html)
- Service worker cache control

To modify, edit `nginx.conf` and rebuild the image.

## Production Deployment

### Deploy to a Server

1. **Transfer files to your server:**
   ```bash
   rsync -avz --exclude node_modules --exclude .git . user@your-server:/path/to/app
   ```

2. **SSH into your server:**
   ```bash
   ssh user@your-server
   cd /path/to/app
   ```

3. **Build and run:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Deploy to Cloud Providers

#### Docker Hub

```bash
# Tag the image
docker tag youpreacher-web:latest yourusername/youpreacher-web:latest

# Push to Docker Hub
docker push yourusername/youpreacher-web:latest
```

#### AWS ECR

```bash
# Login to ECR
aws ecr get-login-password --region region | docker login --username AWS --password-stdin aws_account_id.dkr.ecr.region.amazonaws.com

# Tag the image
docker tag youpreacher-web:latest aws_account_id.dkr.ecr.region.amazonaws.com/youpreacher-web:latest

# Push to ECR
docker push aws_account_id.dkr.ecr.region.amazonaws.com/youpreacher-web:latest
```

#### Google Container Registry

```bash
# Tag the image
docker tag youpreacher-web:latest gcr.io/project-id/youpreacher-web:latest

# Push to GCR
docker push gcr.io/project-id/youpreacher-web:latest
```

## SSL/HTTPS Setup

For production, you should use HTTPS. Here are two approaches:

### Option 1: Nginx with Let's Encrypt (Recommended)

Add a reverse proxy container with SSL:

```yaml
version: '3.8'

services:
  web:
    # ... existing config ...
    expose:
      - "80"
    networks:
      - app-network

  nginx-proxy:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx-ssl.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    networks:
      - app-network

networks:
  app-network:
```

### Option 2: Cloud Provider Load Balancer

Use your cloud provider's load balancer (AWS ALB, GCP Load Balancer, etc.) to handle SSL termination.

## Monitoring and Logs

### View Logs

```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml logs -f

# Docker CLI
docker logs -f youpreacher-web
```

### Health Check

The container includes a health check that runs every 30 seconds:

```bash
# Check container health
docker ps

# Manual health check
curl http://localhost/
```

## Performance Optimization

The production build includes:

1. **Gzip Compression**: Reduces file sizes by ~70%
2. **Static Asset Caching**: 1-year cache for CSS, JS, images, fonts
3. **Service Worker**: No-cache policy for proper updates
4. **Security Headers**: XSS protection, clickjacking prevention
5. **Alpine Linux**: Minimal image size (~50MB total)

## Troubleshooting

### Build Fails

```bash
# Clear Docker cache and rebuild
docker builder prune
docker build --no-cache -f Dockerfile.prod -t youpreacher-web:latest .
```

### Container Won't Start

```bash
# Check logs
docker logs youpreacher-web

# Inspect container
docker inspect youpreacher-web
```

### Port Already in Use

```bash
# Find what's using port 80
lsof -i :80

# Use a different port
docker run -d -p 8080:80 youpreacher-web:latest
```

### Web App Not Loading

1. Check if container is running: `docker ps`
2. Check logs: `docker logs youpreacher-web`
3. Test locally: `curl http://localhost/`
4. Verify build completed: Check if `/usr/share/nginx/html` has files

## Image Size

The production image is optimized for size:
- Build stage: ~500MB (discarded after build)
- Final image: ~50-80MB (nginx:alpine + static files)

## Best Practices

1. **Don't include secrets in the image**: Use environment variables or Docker secrets
2. **Use specific versions**: Tag images with version numbers
3. **Regular updates**: Rebuild images regularly for security updates
4. **Monitor resources**: Set memory and CPU limits in production
5. **Backup strategy**: Have a rollback plan

## Useful Commands

```bash
# Check image size
docker images youpreacher-web

# Inspect image layers
docker history youpreacher-web:latest

# Remove unused images
docker image prune

# View container resource usage
docker stats youpreacher-web

# Execute commands in running container
docker exec -it youpreacher-web sh
```

## Support

For issues or questions, please refer to the main README.md or open an issue in the repository.

