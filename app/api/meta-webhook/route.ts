import { NextRequest, NextResponse } from 'next/server';

// You should set this in your environment variables for security
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'verificationToken';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.info('WEBHOOK VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse('VERIFICATION_FAILED', { status: 403 });
  }
  return new NextResponse('MISSING_PARAMETERS', { status: 400 });
}

