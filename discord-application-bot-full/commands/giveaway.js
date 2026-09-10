const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ez")
    .setDescription("Announce a rigged giveaway.")
    .setDefaultMemberPermissions(null)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user the giveaway was rigged for.")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }

    const hasPermission = interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    );
    const hasStaffRole = interaction.member.roles.cache.has(
      config.staffRoleId
    );

    if (!hasPermission && !hasStaffRole) {
      return interaction.reply({
        content: "❌ You need the Manage Server permission (or the staff role) to use this command.",
        ephemeral: true
      });
    }

    const user = interaction.options.getUser("user", true);

    const embed = new EmbedBuilder()
      .setColor(0x0000ff)
      .setDescription(
        `**Giveaway Rigged!**\nThe next/current/quickdrop has been rigged to ${user} ggz nerd.`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }
};
