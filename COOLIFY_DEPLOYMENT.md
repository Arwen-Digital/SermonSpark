# Coolify Deployment Guide

This guide explains how to deploy the YouPreacher web application using Coolify.

## Prerequisites

- A running Coolify instance
- Git repository connected to Coolify
- Domain name (optional, but recommended)

## Quick Setup

### 1. Create New Resource in Coolify

1. Log in to your Coolify dashboard
2. Click **+ New Resource**
3. Select **Docker Image** or **Git Repository**
4. Choose your repository

### 2. Configure Build Settings

In Coolify's build configuration:

- **Build Pack**: Docker
- **Dockerfile Location**: `Dockerfile.prod`
- **Build Context**: `/`
- **Port**: `80`

### 3. Environment Variables

Add these environment variables in Coolify:

```env
NODE_ENV=production
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_API_URL=https://your-api-domain.com
```

### 4. Domain Configuration

1. Go to **Domains** tab in your Coolify application
2. Add your domain (e.g., `youpreacher.com`)
3. Coolify will automatically handle SSL via Let's Encrypt

### 5. Deploy

Click **Deploy** and Coolify will:

- Pull your repository
- Build the Docker image using `Dockerfile.prod`
- Start the container
- Set up SSL automatically
- Make it available on your domain

## Coolify-Specific Features

### Automatic Deployments

Enable automatic deployments on git push:

1. Go to **Git** tab
2. Enable **Automatic Deployment on Push**
3. Select your branch (e.g., `main` or `production`)

### Health Checks

Coolify uses the `HEALTHCHECK` directive in the Dockerfile automatically.
The app includes a health check that pings `http://localhost/` every 30 seconds.

### Persistent Storage (Optional)

If you need to persist nginx logs:

1. Go to **Storage** tab
2. Add a volume:
   - **Source**: `/var/log/nginx`
   - **Destination**: `/var/log/nginx`

### Zero-Downtime Deployments

Coolify automatically handles zero-downtime deployments by:

1. Building the new image
2. Starting a new container
3. Waiting for health checks to pass
4. Switching traffic to the new container
5. Stopping the old container

## Build Configuration

### Using docker-compose (Alternative)

If you prefer using docker-compose in Coolify:

1. Set **Build Pack** to **Docker Compose**
2. Set **Docker Compose Location** to `docker-compose.prod.yml`
3. Coolify will use the compose file automatically

### Custom Build Command

If you need to run custom commands before/after deployment:

**Pre-deployment Script**:

```bash
#!/bin/bash
echo "Starting deployment..."
# Add any pre-deployment tasks
```

**Post-deployment Script**:

```bash
#!/bin/bash
echo "Deployment complete!"
# Add any post-deployment tasks (cache clearing, etc.)
```

## Environment-Specific Configuration

### Development Instance

Create a separate Coolify app for development/staging:

```env
NODE_ENV=development
EXPO_PUBLIC_API_URL=https://dev-api.youpreacher.com
```

### Production Instance

```env
NODE_ENV=production
EXPO_PUBLIC_API_URL=https://api.youpreacher.com
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

## Monitoring

### View Logs

In Coolify dashboard:

1. Go to your application
2. Click **Logs** tab
3. View real-time application logs

### Resource Usage

Monitor CPU, Memory, and Network usage in the **Metrics** tab.

## Troubleshooting

### Build Fails

1. Check build logs in Coolify
2. Verify `Dockerfile.prod` path is correct
3. Ensure dependencies are installable
4. Check for sufficient disk space

### Container Won't Start

1. Check deployment logs
2. Verify port 80 is exposed
3. Check health check endpoint
4. Review environment variables

### 502 Bad Gateway

1. Container may not be healthy yet (wait 30-60 seconds)
2. Check if the app is listening on port 80
3. Review nginx configuration
4. Check container logs

### SSL Issues

1. Verify domain DNS points to Coolify server
2. Wait a few minutes for Let's Encrypt to provision
3. Check Coolify's proxy logs

## Performance Optimization

### Resource Limits

Set appropriate resource limits in Coolify:

- **Memory**: 256MB - 512MB (the Nginx container is very lightweight)
- **CPU**: 0.5 - 1 CPU cores
- **Restart Policy**: `unless-stopped`

### Scaling

For high-traffic scenarios:

1. Enable **Load Balancing** in Coolify
2. Add multiple replicas
3. Configure **Auto Scaling** based on CPU/Memory

## Backup Strategy

### Database Backups

If using Supabase or external DB, backups are handled externally.

### Application State

Since this is a static web app served by Nginx:

- No application state to backup
- Just ensure your git repository is backed up
- Coolify can rebuild from source at any time

### Docker Image Backup

Coolify automatically retains previous images for rollback.

## Rollback

If a deployment fails or causes issues:

1. Go to **Deployments** tab
2. Click on a previous successful deployment
3. Click **Redeploy**

## Cost Optimization

The production Docker image is highly optimized:

- **Image Size**: ~50-80MB
- **Memory Usage**: ~20-50MB
- **CPU Usage**: Minimal (nginx is very efficient)

You can run this on the smallest VPS tier (512MB RAM).

## Security Best Practices

1. **Environment Variables**: Store all secrets in Coolify's environment variables, never in code
2. **HTTPS**: Always use Coolify's automatic SSL
3. **Private Repository**: Keep your git repository private
4. **Update Regularly**: Rebuild periodically for security updates

## Multi-Environment Setup

### Structure

```
Production:  youpreacher.com        → main branch
Staging:     staging.youpreacher.com → staging branch
Development: dev.youpreacher.com     → dev branch
```

### Coolify Configuration

Create three separate applications in Coolify, each watching different branches.

## CI/CD Integration

While Coolify handles deployment, you can still use GitHub Actions for:

- Running tests before deployment
- Building and caching dependencies
- Sending deployment notifications

## Coolify Commands Reference

### Manual Deployment

Trigger from CLI (if Coolify API is enabled):

```bash
curl -X POST https://your-coolify-instance.com/api/v1/deploy/YOUR_APP_ID \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### View Application Status

In Coolify UI:

- Green: Running and healthy
- Yellow: Deploying or unhealthy
- Red: Stopped or failed

## Support

- **Coolify Docs**: <https://coolify.io/docs>
- **Coolify Discord**: Join for community support
- **GitHub Issues**: Report bugs or request features

## Quick Reference

| Setting | Value |
|---------|-------|
| Dockerfile | `Dockerfile.prod` |
| Port | `80` |
| Health Check | `http://localhost/` |
| Build Time | ~2-5 minutes |
| Image Size | ~50-80MB |
| Memory Usage | ~20-50MB |
| Restart Policy | `unless-stopped` |

## Example Coolify Configuration

Here's what your Coolify settings should look like:

```yaml
# Coolify will detect these from Dockerfile.prod
Port: 80
Health Check URL: /
Health Check Interval: 30s
Health Check Timeout: 3s
Health Check Retries: 3

# Auto-deployment
Git Branch: main
Auto Deploy on Push: Enabled
Force HTTPS: Enabled

# Domain
Domains:
  - youpreacher.com
  - www.youpreacher.com
```

That's it! Coolify makes deployment incredibly simple with Docker.
