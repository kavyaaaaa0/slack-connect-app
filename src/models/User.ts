import { ObjectId } from 'mongodb';

export interface IUser {
  _id?: ObjectId;
  userId: string; // Unique identifier for the user
  sessionId: string; // Session identifier
  createdAt: Date;
  lastActive: Date;
}
