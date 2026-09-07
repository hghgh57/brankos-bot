const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  startGiveaway
} = require("../giveawayManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gcreate")
    .setDescription("Start a giveaway.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    )

    .addStringOption(option =>
      option
        .setName("Prize")
        .setDescription("The giveaway Prize.")
        .setRequired(true)
        .setMaxLength(256)
    )

    .addIntegerOption(option =>
      option
        .setName("winners")
        .setDescription("How many winners.")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )

    .addStringOption(option =>
      option
        .setName("duration")
        .setDescription("Examples: 7d, 24h, 30m, 1h")
        .setRequired(true)
        .setMaxLength(20)
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: "❌ You need the Manage Server permission to use this command.",
        ephemeral: true,
      });
      return;
    }

    const title =
      interaction.options.getString("title");

    const winners =
      interaction.options.getInteger("winners");

    const duration =
      interaction.options.getString("duration");

    let result;

    try {
      result = await startGiveaway({
        interaction,
        prize: title,
        winners,
        duration,
      });
    } catch (error) {
      console.error("/gcreate error:", error);

      await interaction.reply({
        content: "❌ Failed to start the giveaway. Check the bot console for the error.",
        ephemeral: true,
      });
      return;
    }

    if (!result.success) {
      await interaction.reply({
        content: `❌ ${result.error}`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: "✅ Giveaway started!",
      ephemeral: true,
    });
  }
};
