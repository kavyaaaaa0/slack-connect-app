import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAccessToken } from '@/lib/slack';
import { getSessionIdFromRequest, getUserFromSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const db = await getDb();

  const { teamId, channelId, message, sendAt } = await req.json();

  if (!teamId || !channelId || !message || !sendAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate that the user has authenticated this teamId
  const sessionId = await getSessionIdFromRequest(req);
  if (!sessionId) {
    return NextResponse.json({ error: 'No session found' }, { status: 401 });
  }
  const user = await getUserFromSession(sessionId);
  if (!user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const accessToken = await getAccessToken(teamId, user.userId);
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db.collection('ScheduledMessages').insertOne({
    teamId,
    channelId,
    message,
    sendAt: new Date(sendAt),
    sent: false,
    userId: user.userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ success: true, message: 'Message scheduled successfully' });
}
