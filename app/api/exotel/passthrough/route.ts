/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';

// Exotel will POST to this endpoint (Passthru Applet) and expects a JSON with a WSS URL
// Docs: The HTTPS endpoint must return { url: "wss://..." }
// We'll propagate up to 3 custom params and sample-rate if provided.

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    } else {
      // Best-effort parse
      try { body = await request.json(); } catch {}
    }

    // Accept optional parameters from Exotel or upstream flow
    const sampleRate = (body['sample-rate'] || body.sampleRate || body.sample_rate || '16000').toString();
    const custom: Record<string, string> = {};
    // Prioritize common metadata into first three params
    if (body.userId) custom.param1 = String(body.userId);
    if (body.from) custom.param2 = String(body.from);
    if (body.to) custom.param3 = String(body.to);

    // If caller already provided param1/2/3, do not override
    for (const k of ['param1','param2','param3'] as const) {
      if (body[k]) custom[k] = String(body[k]);
    }

    // Build the ws(s) URL. In dev we use ws://, in prod prefer wss://
    // Prefer the incoming request host so the returned WSS URL matches the domain Exotel called.
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const incomingOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : undefined;

    // Build a WSS base from incoming origin if present; otherwise fallback to VERCEL_URL; then to localhost.
    const wssFromIncoming = incomingOrigin
      ? (incomingOrigin.startsWith('http:') ? incomingOrigin.replace('http:', 'ws:') : incomingOrigin.replace('https:', 'wss:'))
      : undefined;
    const base = wssFromIncoming
      || (process.env.VERCEL_URL ? `wss://${process.env.VERCEL_URL}` : undefined)
      || `ws://localhost:3000`;

    // Debug logs to help diagnose connectivity issues (safe, no secrets)
    console.log('[Exotel Passthrough] resolved base:', base, 'incomingOrigin:', incomingOrigin, 'VERCEL_URL:', process.env.VERCEL_URL);

    const params = new URLSearchParams({ 'sample-rate': sampleRate });
    for (const [k, v] of Object.entries(custom)) params.set(k, v);

    const wsUrl = `${base}/api/exotel/ws?${params.toString()}`;

    console.log('[Exotel Passthrough] returning wsUrl:', wsUrl);

    return NextResponse.json({ url: wsUrl });
  } catch (e) {
    console.error('[Exotel Passthrough] Error building WS URL', e);
    return NextResponse.json({ error: 'failed to build ws url' }, { status: 500 });
  }
}
