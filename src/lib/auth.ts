import { getDb } from './db';
import { IUser } from '../models/User';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function createUserSession(): Promise<string> {
  const db = await getDb();
  
  // Generate unique user ID and session ID
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const user: IUser = {
    userId,
    sessionId,
    createdAt: new Date(),
    lastActive: new Date(),
  };
  
  await db.collection('Users').insertOne(user);
  
  return sessionId;
}

export async function getUserFromSession(sessionId: string): Promise<IUser | null> {
  const db = await getDb();
  
  const user = await db.collection('Users').findOne({ sessionId });
  
  if (user) {
    // Update last active time
    await db.collection('Users').updateOne(
      { sessionId },
      { $set: { lastActive: new Date() } }
    );
  }
  
  return user as IUser | null;
}

export async function getSessionIdFromRequest(_req: NextRequest): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('sessionId')?.value || null;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}
