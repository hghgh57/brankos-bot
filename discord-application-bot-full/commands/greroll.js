const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { rerollGiveaway } = require("../giveawayManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("greroll")
    .setDescription("Reroll the winner(s) of a giveaway.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: "❌ You need the Manage Server permission to use this command.",
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
