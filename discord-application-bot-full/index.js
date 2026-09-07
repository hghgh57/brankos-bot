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
  partials: [Partials.Channel]
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

// Login
client.login(process.env.TOKEN);
