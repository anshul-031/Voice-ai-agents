# Exotel Configuration - HTTP Passthrough + WebSocket

This guide shows how to configure Exotel with two static endpoints — one HTTP Passthru on port 8009 and one WebSocket on 8765.

Doc: https://support.exotel.com/support/solutions/articles/3000108630-working-with-the-stream-and-voicebot-applet

## Endpoints Provided

- HTTP Passthrough (Next.js API on 8009):
  - `http://34.143.154.188:8009/api/exotel/passthru` (static; logs/stores call meta; returns `{ ok: true }`)
  - Method: POST (GET returns health/info)

- WebSocket (media stream):
  - `ws://34.143.154.188:8765`
  - No query params required (Exotel default sample rate is 8000)

## How the Flow Works

1. Exotel Passthru Applet hits HTTP URL (static):
  - `http://34.143.154.188:8009/api/exotel/passthru`
  - We store minimal call meta and return `{ ok: true }`.
2. Exotel Voicebot Applet connects to WebSocket URL (static):
  - `ws://34.143.154.188:8765`

Notes:
- Up to 3 custom params are supported and forwarded
- `sample-rate` is intentionally not added to the URL (Exotel default 8000)
- You may pass any 1-3 params (e.g., agentId, locale, sessionId)
— We intentionally avoid adding `sample-rate` (Exotel defaults to 8000) and avoid dynamic WS resolution.

## Exotel Voicebot Applet Setup

- In the applet’s URL field, enter the HTTP passthrough URL:
  - Static: `http://34.143.154.188:8080/voicebot`
  - Optional: Add custom params: `http://34.143.154.188:8080/voicebot?agentId=riya&locale=en-IN`

- Authentication:
  - If using Basic Auth: you can embed in the WSS endpoint when returning a `wss://` URL. For `ws://` on a private IP, prefer IP whitelisting.

- Sample Rate:
  - If not provided, Exotel uses 8000 by default (PSTN quality). We accept default.

## WebSocket Protocol Compliance

The WebSocket server handles these Exotel events (JSON strings):

- `connected`
- `start` (with `sequence_number`, `stream_sid`, `start: { call_sid, account_sid, from, to, custom_parameters, media_format: { encoding, sample_rate, channels } }`)
- `media` (with `sequence_number`, `stream_sid`, `media: { chunk, timestamp, payload }`)
- `dtmf`
- `mark`
- `clear`
- `stop`

Media payloads are 16-bit, 8kHz, mono PCM (little-endian), base64-encoded.

## Health Checks

- HTTP: `http://34.143.154.188:8080/health`
- WS: `http://34.143.154.188:8765/health`

## Deploy

```bash
bash force-cleanup.sh
bash deploy.sh
pm2 logs exotel-http --lines 50
pm2 logs exotel-ws --lines 50
```

## Troubleshooting

- If HTTP 404: ensure `http-passthrough.js` is running via PM2 (`exotel-http`)
- If WS not connecting: verify `exotel-ws` is running and port 8765 is open
- If immediate disconnect: check logs for `connected/start` events and close codes
