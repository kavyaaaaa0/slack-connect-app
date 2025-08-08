import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/slack';
import { WebClient } from '@slack/web-api';
import { getSessionIdFromRequest, getUserFromSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get('teamId');

  if (!teamId) {
    return NextResponse.json({ error: 'No teamId provided' }, { status: 400 });
  }

  // Get user session
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
    console.error(`No access token found for team ${teamId} and user ${user.userId}`);
    return NextResponse.json({ error: 'Could not retrieve access token' }, { status: 401 });
  }

  console.log(`Retrieved access token for team ${teamId} and user ${user.userId}`);

  const client = new WebClient(accessToken);

  try {
    const result = await client.conversations.list({
      types: 'public_channel,private_channel',
      limit: 100
    });

    if (!result.ok) {
      console.error('Slack API error:', result.error);
      return NextResponse.json({ 
        error: 'Failed to fetch channels',
        details: result.error 
      }, { status: 500 });
    }

    console.log(`Successfully fetched ${result.channels?.length || 0} channels`);
    return NextResponse.json(result.channels || []);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json({ 
      error: 'An error occurred while fetching channels',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
