const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { startGiveaway } = require("../giveawayManager");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rps")
    .setDescription("Start a Rock Paper Scissors giveaway (2 winners duel it out).")
    .setDefaultMemberPermissions(null)
    .addStringOption(option =>
      option
        .setName("prize")
        .setDescription("The giveaway prize.")
        .setRequired(true)
        .setMaxLength(256)
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
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }

    const hasPermission = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
    const hasStaffRole = interaction.member.roles.cache.has(config.staffRoleId);

    if (!hasPermission && !hasStaffRole) {
      return interaction.reply({
        content: "❌ You need the Manage Server permission (or the staff role) to use this command.",
        ephemeral: true
      });
    }

    const prize = interaction.options.getString("prize", true).trim();
    const duration = interaction.options.getString("duration", true);

    if (!prize) {
      return interaction.reply({
        content: "❌ Please provide a giveaway prize.",
        ephemeral: true
      });
    }

    let result;

    try {
      result = await startGiveaway({
        interaction,
        prize,
        // /rps never lets the host choose a winner count — it's always
        // a 1v1 duel between exactly 2 winners.
        winners: 2,
        duration,
        isRps: true
      });
    } catch (error) {
      console.error("/rps error:", error);
      return interaction.reply({
        content: "❌ Failed to start the giveaway. Check the bot console for the error.",
        ephemeral: true
      });
    }

    if (!result.success) {
      return interaction.reply({
        content: `❌ ${result.error}`,
        ephemeral: true
      });
    }

    return interaction.reply({
      content: `✅ RPS giveaway started!
**Giveaway ID:** \`${result.giveawayId}\``,
      ephemeral: true
    });
  }
};
