# Deploying Mintlify API to Render

This guide explains how to deploy your Mintlify API as a web service on Render.

## Prerequisites

- A Render account (free tier available)
- Your Mintlify API code in a Git repository

## Deployment Steps

### 1. Push to Git Repository

Make sure your Mintlify API code is in a Git repository (GitHub, GitLab, or Bitbucket):

```bash
git add .
git commit -m "Prepare Mintlify API for Render deployment"
git push origin main
```

### 2. Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Select the repository containing your Mintlify API

### 3. Configure Service Settings

**Basic Settings:**
- **Name**: `mintlify-api` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your deployment branch)
- **Root Directory**: `mintlify` (if API is in subfolder)

**Build & Deploy:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Plan:**
- **Free Tier**: Good for testing and low traffic
- **Starter ($7/month)**: Recommended for production use

### 4. Environment Variables

Add these environment variables in Render dashboard:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Sets production environment |
| `PORT` | `10000` | Render's default port (auto-set) |

### 5. Health Check

Render will automatically use the `/health` endpoint for health checks.

## Post-Deployment

### Get Your API URL

After deployment, Render will provide a URL like:
```
https://mintlify-api-xyz.onrender.com
```

### Update GenVibe Configuration

Update your GenVibe provider configuration to use the deployed URL:

```typescript
// In your GenVibe provider file
const baseURL = 'https://your-mintlify-api.onrender.com/v1';
```

### Test the Deployment

Test your deployed API:

```bash
# Health check
curl https://your-mintlify-api.onrender.com/health

# Test completion
curl -X POST https://your-mintlify-api.onrender.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

## Important Notes

### Cold Starts
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep may take 30+ seconds
- Starter plan and above have no sleep

### Scaling
- Render automatically scales based on traffic
- Monitor performance in Render dashboard
- Upgrade plan if needed for higher traffic

### Logs
- View real-time logs in Render dashboard
- Monitor for errors and performance issues
- Set up log alerts if needed

### Custom Domain (Optional)
- Add custom domain in Render dashboard
- Update DNS settings as instructed
- SSL certificates are automatically managed

## Troubleshooting

### Build Failures
- Check build logs in Render dashboard
- Ensure `package.json` has correct dependencies
- Verify Node.js version compatibility

### Runtime Errors
- Check service logs for error details
- Verify environment variables are set
- Test locally with same environment

### Performance Issues
- Monitor response times in dashboard
- Consider upgrading to higher plan
- Optimize code for better performance

## Cost Optimization

### Free Tier Limitations
- 750 hours/month (enough for 1 service)
- Services sleep after 15 minutes inactivity
- Shared resources

### Starter Plan Benefits ($7/month)
- No sleeping
- Dedicated resources
- Better performance
- Custom domains

## Security

- API runs over HTTPS automatically
- No sensitive data in environment variables
- Monitor access logs for unusual activity
- Consider rate limiting for production use

Your Mintlify API is now ready for production use on Render!
