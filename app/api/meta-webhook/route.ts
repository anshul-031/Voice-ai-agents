import { NextRequest, NextResponse } from 'next/server';

import { processWhatsAppCallback } from '@/lib/whatsAppService';

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const callbackResponse = await req.text(); // Get raw body as string
    console.info(callbackResponse);
    const parsedResponse = JSON.parse(callbackResponse); // Parse body as JSON
    await processWhatsAppCallback(parsedResponse);

    return NextResponse.json({ message: 'SUCCESS' }, { status: 200 });
  } catch (e: any) {
    console.error('Exception while metaMetlifeCallback', e?.message);
    return NextResponse.json({ message: 'ERROR', error: e?.message }, { status: 500 });
  }
}


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
