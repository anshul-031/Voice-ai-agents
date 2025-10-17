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
  // Note: We intentionally DO NOT propagate sample-rate in URL (Exotel defaults to 8000)
  const custom: Record<string, string> = {};
  // Prioritize common metadata into first three params and propagate Exotel fields
  if (body.userId) custom.param1 = String(body.userId);
  if (body.from || body.From) custom.param2 = String(body.from || body.From);
  if (body.to || body.To) custom.param3 = String(body.to || body.To);
  if (body.CallSid) custom.callSid = String(body.CallSid);

    // If caller already provided param1/2/3, do not override
    for (const k of ['param1','param2','param3'] as const) {
      if (body[k]) custom[k] = String(body[k]);
    }

    // Build the ws(s) URL. In dev we use ws://, in prod prefer wss://
    // Build base using incoming origin if available
    const incomingOrigin = request.headers.get('x-forwarded-host')
      ? `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('x-forwarded-host')}`
      : undefined;
    const base = process.env.VERCEL_URL
      ? `wss://${process.env.VERCEL_URL}`
      : incomingOrigin
        ? (incomingOrigin.startsWith('http:') ? incomingOrigin.replace('http:', 'ws:') : incomingOrigin.replace('https:', 'wss:'))
        : `ws://localhost:3000`;

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(custom)) params.set(k, v);

    const wsUrl = `${base}/api/exotel/ws?${params.toString()}`;

  console.log('[Exotel Passthrough] returning wsUrl:', wsUrl);
  // If you're configuring WS statically in Exotel, you can ignore this endpoint
  return NextResponse.json({ url: wsUrl, note: 'Optional: You can configure WS statically in Exotel and ignore this URL' });
  } catch (e) {
    console.error('[Exotel Passthrough] Error building WS URL', e);
    return NextResponse.json({ error: 'failed to build ws url' }, { status: 500 });
  }
}
