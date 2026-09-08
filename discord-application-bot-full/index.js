require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

client.commands = new Collection();

// Make the client available to other files
global.client = client;

// Load commands
const commandsPath = path.join(__dirname, "commands");

for (
  const file of fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"))
) {
  const command = require(
    path.join(commandsPath, file)
  );

  client.commands.set(
    command.data.name,
    command
  );
}

// Load events
const eventsPath = path.join(__dirname, "events");

for (
  const file of fs
    .readdirSync(eventsPath)
    .filter(file => file.endsWith(".js"))
) {
  const event = require(
    path.join(eventsPath, file)
  );

  if (event.once) {
    client.once(
      event.name,
      (...args) =>
        event.execute(...args, client)
    );
  } else {
    client.on(
      event.name,
      (...args) =>
        event.execute(...args, client)
    );
  }
}

// Surface any crash instead of leaving the process hanging in a
// "running but not connected" zombie state (which is why Railway
// can show the deploy as active while the bot shows offline in Discord).
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled promise rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err);
  process.exit(1);
});

// Login
client.login(process.env.TOKEN).catch((err) => {
  console.error("❌ Failed to log in to Discord:", err);
  console.error(
    "If this says 'Used disallowed intents', go to the Discord " +
    "Developer Portal → your app → Bot → Privileged Gateway Intents, " +
    "and enable 'Server Members Intent' and 'Message Content Intent'."
  );
  process.exit(1);
});
