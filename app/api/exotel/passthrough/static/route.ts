/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';

// Static passthrough endpoint: returns a stable WS URL for Exotel
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
      try { body = await request.json(); } catch {}
    }

    // Extract common Exotel fields and custom params
    const sampleRate = (body['sample-rate'] || body.sampleRate || body.sample_rate || '16000').toString();
    const params = new URLSearchParams({ 'sample-rate': sampleRate });

    // Caller metadata if present
    if (body.CallSid) params.set('callSid', String(body.CallSid));
    if (body.From) params.set('from', String(body.From));
    if (body.To) params.set('to', String(body.To));

    for (const k of ['param1','param2','param3'] as const) {
      if (body[k]) params.set(k, String(body[k]));
    }

    // Resolve base domain: prefer incoming host, fallback to VERCEL_URL, then localhost
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || process.env.VERCEL_URL || 'localhost:3000';
    const proto = (request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https'));
    const base = `${proto === 'http' ? 'ws' : 'wss'}://${host}`;

    // Point to static WS path
    const wsUrl = `${base}/api/exotel/ws-static?${params.toString()}`;

    console.log('[Exotel Passthrough Static] Returning wsUrl:', wsUrl);
    return NextResponse.json({ url: wsUrl });
  } catch (e) {
    console.error('[Exotel Passthrough Static] Error building WS URL', e);
    return NextResponse.json({ error: 'failed to build ws url' }, { status: 500 });
  }
}
