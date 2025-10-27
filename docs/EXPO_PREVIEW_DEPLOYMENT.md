# Expo Preview Deployment Guide

This guide explains how to deploy preview builds of your app using EAS (Expo Application Services).

## Prerequisites

1. **EAS CLI** installed globally:
   ```bash
   npm install -g eas-cli
   ```

2. **Expo Account** - Make sure you're logged in:
   ```bash
   eas login
   ```

3. **EAS Project** - Your project is already configured with ID: `488b9145-0e90-4223-a817-f38edc1ef579`

## Current Preview Configuration

Your preview profile uses:
- **Distribution**: Internal (not published to stores)
- **API URL**: `https://api-stg.youpreacher.com`
- **Android**: APK format (easy to install without Play Store)

## Deploy Preview Builds

### Android Preview

```bash
# Build APK for Android preview
eas build --profile preview --platform android
```

What happens:
1. EAS uploads your code to their servers
2. Builds an APK on EAS infrastructure
3. Provides a download link when complete
4. Takes ~10-20 minutes

### iOS Preview

```bash
# Build for iOS preview (requires Apple Developer account)
eas build --profile preview --platform ios
```

For iOS, you need:
- Apple Developer account ($99/year)
- Ad Hoc or Development provisioning profile

### Build Both Platforms

```bash
# Build for both Android and iOS
eas build --profile preview --platform all
```

## Testing the Preview

### Option 1: Download APK/IPA Directly

1. After build completes, EAS provides a download link
2. **Android**: Download APK and install directly
3. **iOS**: Download and install via TestFlight or direct install (if development build)

### Option 2: Use Expo Go (Development Builds Only)

If you want to use Expo Go for quick testing:

```bash
# Start the dev server
npx expo start

# Or specifically for internal distribution
eas build --profile development --platform all
```

### Option 3: Internal Distribution Links

After building, you can share the build link with your team:
1. Go to https://expo.dev
2. Navigate to your project
3. Go to **Builds** section
4. Share the build link with testers

## Add iOS Preview Configuration

To enable iOS preview builds, update your `eas.json`:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true,  // For iOS simulator builds
        "buildType": "release"  // Or "development"
      },
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_EXPRESS_API_URL": "https://api-stg.youpreacher.com"
      }
    }
  }
}
```

## Update Preview Environment Variables

If you need to add more environment variables to your preview build:

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_EXPRESS_API_URL": "https://api-stg.youpreacher.com",
        "EXPO_PUBLIC_SUPABASE_URL": "your_staging_url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your_staging_key",
        "EXPO_PUBLIC_APP_ENV": "preview"
      }
    }
  }
}
```

## Monitoring Build Progress

### Check Build Status

```bash
# List recent builds
eas build:list

# View specific build details
eas build:view [BUILD_ID]
```

### View Logs

```bash
# Stream build logs
eas build:view --json
```

## Sharing Preview Builds

### With QR Code

After build completes:
1. EAS provides a QR code
2. Testers scan with camera (Android) or Expo Go (iOS)
3. Download and install

### Via Email/Link

1. Copy the build URL from EAS dashboard
2. Share with your team
3. They can download directly

## Automatic Updates (OTA)

For preview builds, you can push updates without rebuilding:

```bash
# Publish an update to preview channel
eas update --branch preview --message "Bug fixes"
```

Configure in `eas.json`:

```json
{
  "build": {
    "preview": {
      "channel": "preview"
    }
  }
}
```

## Best Practices

### 1. Use Different Channels

- `development` - For active development
- `preview` - For QA/staging testing
- `production` - For production releases

### 2. Version Management

Update version in `app.json` before building:

```json
{
  "expo": {
    "version": "1.0.0-preview.1"
  }
}
```

### 3. Environment Separation

Keep separate API endpoints:
- Development: `dev-api.youpreacher.com`
- Preview/Staging: `api-stg.youpreacher.com`
- Production: `api.youpreacher.com`

## Troubleshooting

### Build Fails

```bash
# Clear cache and retry
eas build --profile preview --platform android --clear-cache
```

### Not Logged In

```bash
# Login to Expo
eas login

# Verify login
eas whoami
```

### Missing Credentials

```bash
# Configure Android credentials
eas credentials

# Or let EAS manage them automatically (recommended)
# Just run the build and follow prompts
```

### Bundle Identifier Issues

Make sure `app.json` has correct identifiers:
- **Android**: `com.youpreacher.sermon`
- **iOS**: `com.youpreacher.sermon`

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/preview-build.yml`:

```yaml
name: EAS Preview Build

on:
  push:
    branches:
      - staging
      - preview

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build Preview
        run: eas build --profile preview --platform all --non-interactive
```

## Cost Considerations

EAS Build pricing:
- **Free tier**: Limited builds per month
- **Production plan**: $29/month for team collaboration
- **Enterprise**: Custom pricing

Check current limits: https://expo.dev/pricing

## Quick Commands Reference

```bash
# Login
eas login

# Build Android preview
eas build --profile preview --platform android

# Build iOS preview
eas build --profile preview --platform ios

# Build both
eas build --profile preview --platform all

# List builds
eas build:list

# View build details
eas build:view [BUILD_ID]

# Push OTA update
eas update --branch preview

# Configure credentials
eas credentials

# Check EAS status
eas build:list --status=finished
```

## Resources

- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/introduction/
- **EAS Update**: https://docs.expo.dev/eas-update/introduction/
- **Expo Dashboard**: https://expo.dev/accounts/arnoldgamboa/projects/you-preacher

## Support

- **Expo Discord**: https://chat.expo.dev/
- **Expo Forums**: https://forums.expo.dev/
- **GitHub Issues**: For Expo-specific issues


