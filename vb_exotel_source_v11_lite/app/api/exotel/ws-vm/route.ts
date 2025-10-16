import { NextRequest } from 'next/server';

/**
 * VM-Compatible WebSocket Handler for Exotel
 * 
 * NOTE: This endpoint returns connection instructions for manual WebSocket setup.
 * Next.js App Router doesn't support native WebSocket servers in Node.js runtime.
 * 
 * For production VM deployment, consider:
 * 1. Using a separate WebSocket server (ws library)
 * 2. Using Socket.io
 * 3. Using a reverse proxy (Nginx) to handle WebSocket upgrades
 * 
 * For testing, use the Vercel deployment or set up a standalone WS server.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sampleRate = searchParams.get('sample-rate') || '8000';
  const callSid = searchParams.get('CallSid');
  const from = searchParams.get('From');
  const to = searchParams.get('To');

  console.log('[Exotel WS-VM] Connection attempt:', {
    sampleRate,
    callSid,
    from,
    to,
    headers: Object.fromEntries(request.headers.entries()),
  });

  return new Response(
    JSON.stringify({
      error: 'WebSocket not supported in Next.js Node runtime',
      message: 'This endpoint requires Edge runtime or a standalone WebSocket server',
      info: {
        sampleRate,
        callSid,
        from,
        to,
      },
      suggestions: [
        'Use Vercel deployment (Edge runtime)',
        'Setup standalone WebSocket server with ws library',
        'Use Nginx as reverse proxy for WebSocket',
      ],
    }),
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
