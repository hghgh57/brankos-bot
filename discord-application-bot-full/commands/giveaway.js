const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const { startGiveaway } = require("../giveawayManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gcreate")
    .setDescription("Start a giveaway.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option
        .setName("title")
        .setDescription("The giveaway prize.")
        .setRequired(false)
        .setMaxLength(256)
    )
    .addStringOption(option =>
      option
        .setName("prize")
        .setDescription("The giveaway prize.")
        .setRequired(false)
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
    try {
      if (!interaction.inGuild()) {
        return interaction.reply({
          content: "❌ This command can only be used in a server.",
          flags: MessageFlags.Ephemeral
        });
      }

      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({
          content: "❌ You need the Manage Server permission to use this command.",
          flags: MessageFlags.Ephemeral
        });
      }

      const title = interaction.options.getString("title");
      const prizeOption = interaction.options.getString("prize");
      const prize = (prizeOption || title || "").trim();
      const winners = interaction.options.getInteger("winners", true);
      const duration = interaction.options.getString("duration", true);

      if (!prize) {
        return interaction.reply({
          content: "❌ Please provide a giveaway prize.",
          flags: MessageFlags.Ephemeral
        });
      }

      // A giveaway message is sent before startGiveaway resolves, so acknowledge
      // the slash command first. Discord interactions must be acknowledged quickly.
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const result = await startGiveaway({
        interaction,
        prize,
        winners,
        duration
      });

      if (!result?.success) {
        return interaction.editReply({
          content: `❌ ${result?.error || "Failed to start the giveaway."}`
        });
      }

      return interaction.editReply({
        content: `✅ Giveaway started!\n**Giveaway ID:** \`${result.giveawayId}\``
      });
    } catch (error) {
      console.error("/gcreate error:", error);

      if (interaction.deferred || interaction.replied) {
        return interaction.editReply({
          content: "❌ Failed to start the giveaway. Check the bot console for the error."
        }).catch(() => {});
      }

      return interaction.reply({
        content: "❌ Failed to start the giveaway. Check the bot console for the error.",
        flags: MessageFlags.Ephemeral
      }).catch(() => {});
    }
  }
};
