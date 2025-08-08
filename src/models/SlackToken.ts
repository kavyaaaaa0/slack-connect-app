export interface ISlackToken {
  _id?: string;
  userId: string; // User who owns this token
  teamId: string;
  teamName?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType: 'bot' | 'user';
  scope: string;
  authedUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}
