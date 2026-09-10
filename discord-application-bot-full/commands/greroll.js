const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { rerollGiveaway } = require("../giveawayManager");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("greroll")
    .setDescription("Reroll the winner(s) of a giveaway.")
    .setDefaultMemberPermissions(null)
    .addStringOption(option =>
      option
        .setName("giveawayid")
        .setDescription("The giveaway ID (DM'd to the host when it started).")
        .setRequired(true)
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

    const giveawayId = interaction.options
      .getString("giveawayid", true)
      .trim();

    try {
      await rerollGiveaway(interaction, giveawayId);
    } catch (error) {
      console.error("/greroll error:", error);

      const payload = {
        content: "❌ Failed to reroll the giveaway. Check the bot console for the error.",
        ephemeral: true
      };

      if (interaction.deferred || interaction.replied) {
        return interaction.followUp(payload);
      }

      return interaction.reply(payload);
    }
  }
};
