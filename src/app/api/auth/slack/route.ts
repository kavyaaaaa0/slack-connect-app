import { NextRequest, NextResponse } from 'next/server';
import { InstallProvider } from '@slack/oauth';

const installer = new InstallProvider({
  clientId: process.env.SLACK_CLIENT_ID!,
  clientSecret: process.env.SLACK_CLIENT_SECRET!,
  stateSecret: 'my-state-secret', // You should use a more secure, randomly generated secret in production
});

export async function GET(req: NextRequest) {
  console.log('Starting Slack OAuth flow...');
  console.log('Client ID:', process.env.SLACK_CLIENT_ID ? 'Set' : 'Missing');
  console.log('Client Secret:', process.env.SLACK_CLIENT_SECRET ? 'Set' : 'Missing');

  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/slack/callback`;
  console.log('Redirect URL:', redirectUri);
  
  // Generate the installation URL with the state parameter
  const slackInstallUrl = await installer.generateInstallUrl({
    scopes: ['chat:write', 'channels:read', 'groups:read', 'mpim:read', 'im:read'],
    userScopes: ['chat:write'],
    redirectUri,
  });

  console.log('Redirecting to Slack:', slackInstallUrl);
  return NextResponse.redirect(slackInstallUrl);
}