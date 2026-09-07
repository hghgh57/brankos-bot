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
    // Server/guild information
    GatewayIntentBits.Guilds,

    // REQUIRED for guildMemberAdd / guildMemberRemove
    GatewayIntentBits.GuildMembers,

    // Messages
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,

    // Voice channels
    GatewayIntentBits.GuildVoiceStates,

    // DMs
    GatewayIntentBits.DirectMessages
  ],

  partials: [
    Partials.Channel
  ]
});

client.commands = new Collection();

// Make client available to other files
global.client = client;

// ================================
// LOAD COMMANDS
// ================================

const commandsPath =
  path.join(__dirname, "commands");

for (
  const file of fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"))
) {
  try {
    const command =
      require(path.join(commandsPath, file));

    if (
      command &&
      command.data &&
      command.data.name
    ) {
      client.commands.set(
        command.data.name,
        command
      );

      console.log(
        `✅ Loaded command: /${command.data.name}`
      );
    } else {
      console.log(
        `⚠️ Skipped invalid command file: ${file}`
      );
    }

  } catch (error) {
    console.error(
      `❌ Failed to load command ${file}:`,
      error
    );
  }
}

// ================================
// LOAD EVENTS
// ================================

const eventsPath =
  path.join(__dirname, "events");

for (
  const file of fs
    .readdirSync(eventsPath)
    .filter(file => file.endsWith(".js"))
) {
  try {
    const event =
      require(path.join(eventsPath, file));

    if (
      !event ||
      !event.name ||
      !event.execute
    ) {
      console.log(
        `⚠️ Skipped invalid event file: ${file}`
      );

      continue;
    }

    if (event.once) {
      client.once(
        event.name,
        (...args) =>
          event.execute(
            ...args,
            client
          )
      );
    } else {
      client.on(
        event.name,
        (...args) =>
          event.execute(
            ...args,
            client
          )
      );
    }

    console.log(
      `✅ Loaded event: ${event.name}`
    );

  } catch (error) {
    console.error(
      `❌ Failed to load event ${file}:`,
      error
    );
  }
}

// ================================
// LOGIN
// ================================

client.login(process.env.TOKEN);
