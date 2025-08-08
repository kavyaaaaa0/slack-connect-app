import { NextResponse } from 'next/server';
import { sendScheduledMessages } from '@/lib/cron';

export async function GET() {
  try {
    await sendScheduledMessages();
    return NextResponse.json({ success: true, message: 'Cron job ran successfully' });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: 'Cron job failed' }, { status: 500 });
  }
}
