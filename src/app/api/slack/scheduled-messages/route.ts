import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionIdFromRequest, getUserFromSession } from '@/lib/auth';
import { ObjectId, Document } from 'mongodb';

interface ScheduledMessageDoc extends Document {
  _id: ObjectId | string;
  userId: string;
  teamId: string;
  channelId: string;
  message: string;
  sendAt: Date;
  sent: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = await getSessionIdFromRequest(req);
    if (!sessionId) return NextResponse.json({ error: 'No session found' }, { status: 401 });

    const user = await getUserFromSession(sessionId);
    if (!user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const teamId = req.nextUrl.searchParams.get('teamId');
    if (!teamId) return NextResponse.json({ error: 'No teamId provided' }, { status: 400 });

    const db = await getDb();
    const coll = db.collection<ScheduledMessageDoc>('ScheduledMessages');

    const scheduledMessages = await coll
      .find({ teamId, userId: user.userId })
      .sort({ sendAt: 1 })
      .toArray();

    const normalized = scheduledMessages.map((doc) => ({
      ...doc,
      _id: typeof doc._id === 'string' ? doc._id : doc._id.toString(),
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    return NextResponse.json({ error: 'An error occurred while fetching scheduled messages' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionId = await getSessionIdFromRequest(req);
    if (!sessionId) return NextResponse.json({ error: 'No session found' }, { status: 401 });

    const user = await getUserFromSession(sessionId);
    if (!user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'No valid message ID provided' }, { status: 400 });
    }

    const db = await getDb();
    const coll = db.collection<ScheduledMessageDoc>('ScheduledMessages');

    const filterByObjectId = ObjectId.isValid(id)
      ? { _id: new ObjectId(id), userId: user.userId }
      : null;

    const filterByStringId = { _id: id as string, userId: user.userId };

    const result = filterByObjectId
      ? await coll.deleteOne(filterByObjectId)
      : await coll.deleteOne(filterByStringId);

    if (!result || result.deletedCount === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Scheduled message cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    return NextResponse.json({ error: 'An error occurred while cancelling the message' }, { status: 500 });
  }
}
