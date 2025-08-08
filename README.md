## DEPLOYED ON VERCEL-
🔗 **Live App**: [https://slack-connect-app.vercel.app](https://slack-connect-app.vercel.app)



# Slack Connect

Slack Connect is a full-stack application built with [Next.js](https://nextjs.org) that enables users to connect their Slack workspaces, send messages instantly, and schedule them for future delivery. It utilizes the Slack API with OAuth 2.0 for secure authentication and robust token management.

## Features

* **Secure Slack Connection**: Authenticate your Slack workspace using the OAuth 2.0 protocol.
* **Instant & Scheduled Messaging**: Send messages to any channel immediately or schedule them for a future date and time.
* **Message Management**: View a list of all currently scheduled messages and cancel them before they are sent.
* **Channel Viewing**: See a list of channels from your connected workspace.
* **Automated Token Refresh**: Access tokens are automatically refreshed before expiration, ensuring uninterrupted service without user re-authentication.

## Architectural Overview

The application is built with Next.js and uses MongoDB for data persistence. The architecture is designed for scalability and maintainability, with a clear separation of concerns.



### OAuth 2.0 and Token Management

The authentication process follows the standard OAuth 2.0 flow. When a user connects to their Slack workspace, they are redirected to Slack's authorization page. Upon approval, Slack provides an authorization code, which the backend exchanges for an access token and a refresh token.

These tokens are securely stored in the MongoDB database. The application automatically handles the token refresh process. When an access token is about to expire, the refresh token is used to obtain a new one from Slack, ensuring continuous connectivity.

### Scheduled Task Handling

The application leverages the Slack API to schedule messages. Users can select a channel, compose a message, and set a future delivery time. A cron job runs periodically on the backend to check for due messages and sends them at the appropriate time. The application also provides an interface to view and delete these scheduled messages.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or later)
* [npm](https://www.npmjs.com/) 
* [MongoDB](https://www.mongodb.com/try/download/community) (a local instance or a MongoDB Atlas account)
* A [Slack App](https://api.slack.com/apps) with the necessary permissions.

### Installation & Configuration


1.  **IMPORTANT** **Add Bot to Channels:**
    To allow the application to send messages, you must invite the bot to the desired channels within your Slack workspace. Invite the Bot to Channels->
```bash
/invite @Slack Connect Bot

2.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/slack-connect.git](https://github.com/your-username/slack-connect.git)
    cd slack-connect
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    
    ```

4.  **Set up environment variables:**
    Create a `.env.local` file in the project root and add the following variables:
    ```env
    SLACK_CLIENT_ID=your_slack_client_id
    SLACK_CLIENT_SECRET=your_slack_client_secret
    NEXT_PUBLIC_URL= ADD YOUR REDIRECTED URI FROM SLACK
    MONGODB_URI=your_mongodb_connection_string
    ```
    Replace the placeholder values with your actual Slack app credentials and MongoDB connection string.

5.  **Configure Slack Redirect URI:**
    In your Slack App's configuration settings under "OAuth & Permissions", add the following **Redirect URI**:
    `http://localhost:3000/api/auth/slack/callback` OR your vercel link.



### Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev

    ```

2.  **Open the application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Challenges & Learnings

### OAuth Flow and Token Management

A primary challenge was implementing the OAuth 2.0 flow securely, including handling the redirect URI, exchanging the authorization code for tokens, and securely storing them. Implementing the token refresh mechanism was another critical piece to ensure the application could maintain API access without requiring user re-authentication. This project was a great learning experience in understanding the intricacies of the OAuth 2.0 protocol.

### Dynamic Redirect URI during Development

Using a tunneling service like `ngrok` is necessary for Slack's webhooks to reach a local server. However, the free version of `ngrok` generates a new public URL on each restart, requiring frequent updates to the redirect URI in the Slack App configuration. While manageable for development, the permanent solution is to deploy the application to a hosting service that provides a stable public URL.

