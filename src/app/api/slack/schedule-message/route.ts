import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { IScheduledMessage } from '@/models/ScheduledMessage';
import { getSessionIdFromRequest, getUserFromSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const sessionId = await getSessionIdFromRequest(req);
    
    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }
    
    const user = await getUserFromSession(sessionId);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const { teamId, channelId, message, sendAt } = await req.json();

    if (!teamId || !channelId || !message || !sendAt) {
      return NextResponse.json({ 
        error: 'Missing required fields: teamId, channelId, message, or sendAt' 
      }, { status: 400 });
    }

    // Validate that the scheduled time is in the future
    const scheduledTime = new Date(sendAt);
    const now = new Date();
    
    if (scheduledTime <= now) {
      return NextResponse.json({ 
        error: 'Cannot schedule messages in the past. Please select a future date and time.' 
      }, { status: 400 });
    }

    const scheduledMessage: IScheduledMessage = {
      userId: user.userId,
      teamId,
      channelId,
      message,
      sendAt: new Date(sendAt),
      sent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDb();
    const result = await db.collection('ScheduledMessages').insertOne(scheduledMessage);

    return NextResponse.json({ 
      success: true, 
      message: 'Message scheduled successfully',
      id: result.insertedId 
    });
  } catch (error) {
    console.error('Error scheduling message:', error);
    return NextResponse.json({ 
      error: 'An error occurred while scheduling the message' 
    }, { status: 500 });
  }
}
