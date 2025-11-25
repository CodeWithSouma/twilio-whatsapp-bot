# Twilio WhatsApp AI Auto-Reply Bot (Sandbox)

## What you get
- Node.js + Express backend that handles Twilio WhatsApp Sandbox webhook
- Integration with OpenAI for AI fallback replies
- Modern dashboard UI (inspired by iLovePDF clean layout) to edit intents, test chat, and view logs
- `.env.example` with required variables
- Instructions to deploy to Render / Railway

## Quick setup (local)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill values:
   - `PORT` (default 4000)
   - `TWILIO_ACCOUNT_SID` (from Twilio Console)
   - `TWILIO_AUTH_TOKEN` (from Twilio Console)
   - `TWILIO_WHATSAPP_FROM` (WhatsApp sandbox number, e.g. whatsapp:+1415xxxxxxx)
   - `OPENAI_API_KEY` (OpenAI key)
   - `BUSINESS_NAME`, `BUSINESS_WEBSITE_URL`
3. Start server:
   ```bash
   npm run dev
   ```
4. Ngrok (optional for local Twilio webhook):
   ```bash
   npx ngrok http 4000
   ```
   Set Twilio sandbox incoming webhook URL to `https://<your-ngrok>.ngrok.io/webhook/twilio`

## Twilio Sandbox notes
- Go to https://www.twilio.com/console/sms/whatsapp/learn
- Join the sandbox by sending the provided keyword from your WhatsApp to Twilio's sandbox number
- In the sandbox config, set "WHEN A MESSAGE COMES IN" webhook to `https://<your-host>/webhook/twilio` (POST)

## Files
- `backend/server.js` : main Express server
- `frontend/` : dashboard UI (Tailwind via CDN)
- `package.json` : scripts and dependencies
- `.env.example` : env variables template

## Features
- Intent rules (keyword-based) editable in dashboard
- AI fallback using OpenAI ChatCompletion
- Logs of messages (in-memory for demo)
- Send messages back to users via Twilio API

## Next steps / Production
- Persist intents / logs in a DB (SQLite/Postgres)
- Add authentication for the dashboard
- Multi-tenant support to manage multiple clients
- Rate-limiting & cost control for OpenAI usage

