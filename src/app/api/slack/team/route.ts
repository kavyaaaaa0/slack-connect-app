import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionIdFromRequest, getUserFromSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionId = await getSessionIdFromRequest(req);
    
    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }
    
    const user = await getUserFromSession(sessionId);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const db = await getDb();
    console.log('Looking for token for user:', user.userId);
    const token = await db.collection('SlackToken').findOne({ userId: user.userId });

    if (!token) {
      console.error('No token found for user:', user.userId);
      return NextResponse.json({ error: 'No authenticated team found' }, { status: 401 });
    }

    console.log('Found token for team:', token.teamId, 'team name:', token.teamName);

    return NextResponse.json({ 
      teamId: token.teamId,
      teamName: token.teamName || 'Unknown Team'
    });
  } catch (error) {
    console.error('Error fetching team info:', error);
    return NextResponse.json({ 
      error: 'An error occurred while fetching team information' 
    }, { status: 500 });
  }
}
