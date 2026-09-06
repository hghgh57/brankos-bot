# Discord Application Bot

## Features
- Welcome messages
- Leave messages
- Staff Application button
- Partner Manager button
- Builder Application button
- Applications happen in DMs
- Users can type `cancel`
- Completed applications are sent to a review channel
- `/embed` command with optional title
- `/embed` can send an embed or plain text
- `/setup-applications` sends the application panel

## Setup

1. Install Node.js 18 or newer.
2. Open this folder in your terminal.
3. Run:
   `npm install`
4. Rename `.env.example` to `.env`.
5. Put your bot token, client ID and server ID in `.env`.
6. Put the welcome, leave and application review channel IDs in `.env`.
7. Run:
   `node deploy-commands.js`
8. Start the bot:
   `node index.js`

## Discord Developer Portal

Enable these intents:
- Server Members Intent
- Message Content Intent

The bot needs permissions to:
- View Channels
- Send Messages
- Embed Links
- Read Message History

For DMs, users must allow DMs from the server.

## Editing questions

Open `config.js`.

Each application has a `questions` list. Replace the questions with your own.

## Commands

`/setup-applications`
Sends the three application buttons.

`/embed`
Options:
- message = required
- title = optional
- embed = true/false

Examples:
- `/embed message:Hello everyone!`
- `/embed message:Read the rules title:Rules`
- `/embed message:Hello title:Test embed:false`
