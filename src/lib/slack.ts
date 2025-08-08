import { ISlackToken } from '../models/SlackToken';
import { getDb } from './db';

export async function getAccessToken(teamId: string, userId: string): Promise<string | null> {
  const db = await getDb();
  const tokenInfo = await db.collection('SlackToken').findOne({ teamId, userId });

  if (!tokenInfo) {
    return null;
  }

  // Check if token is expired (with 5 minute buffer)
  const now = new Date();
  const expiresAt = new Date(tokenInfo.expiresAt);
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

  if (now < new Date(expiresAt.getTime() - bufferTime)) {
    return tokenInfo.accessToken;
  }

  // Token is expired or will expire soon, refresh it
  if (!tokenInfo.refreshToken) {
    console.error(`No refresh token available for team ${teamId}`);
    return null;
  }

  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.SLACK_CLIENT_ID}:${process.env.SLACK_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenInfo.refreshToken,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Failed to refresh token:', data.error);
      // If refresh fails, remove the invalid token
      await db.collection('SlackToken').deleteOne({ teamId });
      return null;
    }

    const { access_token, refresh_token, expires_in } = data;
    const newExpiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);

    await db.collection('SlackToken').updateOne(
      { teamId },
      {
        $set: {
          accessToken: access_token,
          refreshToken: refresh_token || tokenInfo.refreshToken,
          expiresAt: newExpiresAt,
          updatedAt: new Date(),
        },
      }
    );

    console.log(`Successfully refreshed token for team ${teamId}`);
    return access_token;
  } catch (error) {
    console.error(`Error refreshing token for team ${teamId}:`, error);
    return null;
  }
}

export async function getAllTeams(userId: string): Promise<ISlackToken[]> {
  const db = await getDb();
  const teams = await db.collection('SlackToken').find({ userId }).toArray();
  return teams as unknown as ISlackToken[];
}

export async function removeTeam(teamId: string, userId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection('SlackToken').deleteOne({ teamId, userId });
  return result.deletedCount > 0;
}
