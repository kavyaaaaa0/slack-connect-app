import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionIdFromRequest, getUserFromSession, createUserSession } from '@/lib/auth';
import { ISlackToken } from '@/models/SlackToken';

export async function GET(req: NextRequest) {
  try {
    console.log('Slack callback received:', req.url);
    
    // Extract the code and state from the URL
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    // Removed unused 'state'
    
    if (!code) {
      console.error('No code parameter in callback');
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    console.log('Processing OAuth callback with code:', code);
    
    // Exchange the code for access token using Slack's OAuth API
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code: code,
        redirect_uri: `${new URL(req.url).origin}/api/auth/slack/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Full Slack response:', JSON.stringify(tokenData, null, 2));
    console.log('Token response received:', {
      ok: tokenData.ok,
      hasAccessToken: !!tokenData.access_token,
      hasTeam: !!tokenData.team,
      hasRefreshToken: !!tokenData.refresh_token,
      hasExpiresIn: !!tokenData.expires_in,
      error: tokenData.error,
      teamId: tokenData.team?.id,
      teamName: tokenData.team?.name,
    });

    if (!tokenData.ok) {
      console.error('Slack OAuth error:', tokenData.error);
      return NextResponse.json({ 
        error: 'Slack OAuth failed',
        details: tokenData.error
      }, { status: 400 });
    }

    const { access_token, refresh_token, expires_in, team } = tokenData;

    // Check for required fields - team and access_token are essential
    if (!team || !access_token) {
      console.error('Missing essential fields from Slack response:', {
        hasTeam: !!team,
        hasAccessToken: !!access_token,
        teamId: team?.id,
        availableFields: Object.keys(tokenData),
      });
      return NextResponse.json({ 
        error: 'Invalid response from Slack',
        details: 'Missing essential OAuth fields (team or access_token)',
        availableFields: Object.keys(tokenData)
      }, { status: 400 });
    }

    console.log('Saving token to database for team:', team.id);
    
    // Get or create user session
    let sessionId = await getSessionIdFromRequest(req);
    let user = null;
    
    if (sessionId) {
      user = await getUserFromSession(sessionId);
    }
    
    if (!user) {
      // Create new user session
      sessionId = await createUserSession();
      user = await getUserFromSession(sessionId);
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user session' }, { status: 500 });
    }
    
    // Set default values for missing fields
    const expiresAt = expires_in 
      ? new Date(Date.now() + expires_in * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to 24 hours if no expires_in
    
    try {
      const db = await getDb();
      console.log('Database connection successful');

      const tokenRecord: ISlackToken = {
        userId: user.userId,
        teamId: team.id,
        teamName: team.name,
        accessToken: access_token,
        refreshToken: refresh_token || undefined,
        expiresAt: expiresAt,
        tokenType: tokenData.token_type || 'bot',
        scope: tokenData.scope,
        authedUserId: tokenData.authed_user?.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('SlackToken').updateOne(
        { teamId: team.id, userId: user.userId },
        { $set: tokenRecord },
        { upsert: true }
      );
      console.log('Token saved successfully for team:', team.id, 'and user:', user.userId);
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }

    const redirectUrl = `${new URL(req.url).origin}/success`;
    console.log('Redirecting to success page:', redirectUrl);
    
    const response = NextResponse.redirect(redirectUrl);
    
    // Set session cookie
    if (sessionId) {
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error during Slack OAuth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'An error occurred', details: errorMessage }, { status: 500 });
  }
}
