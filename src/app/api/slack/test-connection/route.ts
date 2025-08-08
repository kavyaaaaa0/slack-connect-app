import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/slack';
import { WebClient } from '@slack/web-api';
import { getSessionIdFromRequest, getUserFromSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const teamId = req.nextUrl.searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'No teamId provided' }, { status: 400 });
    }

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

    // Test 1: Check auth
    const authTest = await client.auth.test();
    console.log('Auth test result:', authTest);

    // Test 2: Try to get channels
    const channelsResult = await client.conversations.list({
      types: 'public_channel,private_channel',
      limit: 10
    });

    console.log('Channels result:', channelsResult);

    return NextResponse.json({
      success: true,
      auth: authTest,
      channels: channelsResult.channels?.slice(0, 5) || [],
      totalChannels: channelsResult.channels?.length || 0
    });
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json({ 
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
