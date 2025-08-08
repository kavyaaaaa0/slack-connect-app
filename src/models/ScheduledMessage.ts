import { ObjectId } from 'mongodb';

export interface IScheduledMessage {
  _id?: ObjectId;
  userId: string; // User who owns this scheduled message
  teamId: string;
  channelId: string;
  message: string;
  sendAt: Date;
  sent: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}