import { setSession } from '@/lib/exotel-session';
import { NextRequest, NextResponse } from 'next/server';

// Static Passthrough endpoint (no WS URL). Use this in Exotel Passthru Applet.
// Logs and stores basic call metadata, then responds { ok: true }.
export async function POST(request: NextRequest) {
  try {
    // Diagnostic: capture remote and key headers
    console.log('[Exotel Passthru] Incoming request headers:', Object.fromEntries(request.headers));
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

    const callSid = String(body.CallSid || body.callSid || body.sid || '');
    const from = String(body.From || body.from || '');
    const to = String(body.To || body.to || '');
    const param1 = body.param1 ? String(body.param1) : undefined;
    const param2 = body.param2 ? String(body.param2) : undefined;
    const param3 = body.param3 ? String(body.param3) : undefined;

    if (!callSid) {
      console.warn('[Exotel Passthru] Missing CallSid');
      return NextResponse.json({ ok: false, error: 'Missing CallSid' }, { status: 400 });
    }

    const custom: Record<string, string> = {};
    if (param1) custom.param1 = param1;
    if (param2) custom.param2 = param2;
    if (param3) custom.param3 = param3;

    setSession(callSid, { from, to, custom });
    console.log('[Exotel Passthru] Stored session meta for', callSid, { from, to, custom });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[Exotel Passthru] Error', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  // Simple health/info for quick checks
  return NextResponse.json({
    ok: true,
    service: 'exotel-passthru',
    note: 'POST to store call meta. No WS URL returned.'
  });
}
