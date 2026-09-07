require("dotenv").config();

const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ Missing TOKEN, CLIENT_ID or GUILD_ID in your .env/environment variables.");
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"))) {
  try {
    const command = require(path.join(commandsPath, file));

    if (!command?.data?.name) {
      console.error(`❌ Skipping ${file}: no valid command data/name.`);
      continue;
    }

    commands.push(command.data.toJSON());
    console.log(`✅ Prepared /${command.data.name}`);
  } catch (error) {
    console.error(`❌ Failed to load command ${file}:`, error);
    process.exit(1);
  }
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log(`📦 Registering ${commands.length} slash commands to guild ${GUILD_ID}...`);

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("✅ Slash commands registered successfully.");
    console.log("✅ /gcreate is included in the registered commands.");
  } catch (error) {
    console.error("❌ Failed to register slash commands:", error);
    process.exit(1);
  }
})();
