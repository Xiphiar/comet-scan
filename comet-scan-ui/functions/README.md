# Cloudflare Functions Setup

This directory contains Cloudflare Pages Functions for the Comet Scan UI.

## Feedback System Setup

### Discord Webhook Configuration

1. Create a Discord webhook in your desired channel:
   - Go to your Discord channel settings
   - Navigate to Integrations → Webhooks
   - Click "New Webhook"
   - Copy the webhook URL

2. Add the webhook URL as an environment variable in Cloudflare Pages:
   - Go to your Cloudflare Pages project settings
   - Navigate to Settings → Environment variables
   - Add a new variable:
     - Variable name: `DISCORD_WEBHOOK_URL`
     - Value: Your Discord webhook URL
   - Save the changes

### Local Development

For local development, create a `.dev.vars` file in this directory:

```
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
```

**Note:** Never commit the `.dev.vars` file to version control.

### Function Endpoints

- `POST /api/submit-feedback` - Submits user feedback to Discord

### Testing

You can test the feedback function locally using:

```bash
npx wrangler pages dev --compatibility-date=2023-05-18
``` 