import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/slack';
import { WebClient } from '@slack/web-api';
import { getSessionIdFromRequest, getUserFromSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { teamId, channelId, message } = await req.json();

    if (!teamId || !channelId || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: teamId, channelId, or message' 
      }, { status: 400 });
    }

    // Validate user session and resolve access token for this user + team
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
      return NextResponse.json({ error: 'Could not retrieve access token' }, { status: 401 });
    }

    const client = new WebClient(accessToken);

    const result = await client.chat.postMessage({
      channel: channelId,
      text: message,
    });

    if (!result.ok) {
      return NextResponse.json({ 
        error: 'Failed to send message',
        details: result.error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully',
      timestamp: result.ts 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ 
      error: 'An error occurred while sending the message' 
    }, { status: 500 });
  }
}
