import { getAccessToken } from './slack';
import { WebClient } from '@slack/web-api';
import { getDb } from './db';

export async function sendScheduledMessages() {
  const db = await getDb();

  const messagesToSend = await db.collection('ScheduledMessages').find({
    sendAt: { $lte: new Date() },
    sent: false
  }).toArray();

  for (const message of messagesToSend) {
    const accessToken = await getAccessToken(message.teamId, message.userId);

    if (!accessToken) {
      console.error(`Could not get access token for team ${message.teamId} and user ${message.userId}`);
      continue;
    }

    const client = new WebClient(accessToken);

    try {
      await client.chat.postMessage({
        channel: message.channelId,
        text: message.message,
      });

      await db.collection('ScheduledMessages').updateOne(
        { _id: message._id },
        { $set: { sent: true, updatedAt: new Date() } }
      );
      
      console.log(`Successfully sent scheduled message to channel ${message.channelId} for user ${message.userId}`);
    } catch (error) {
      console.error(
        `Failed to send message to channel ${message.channelId} for user ${message.userId}:`,
        error
      );
    }
  }
}
