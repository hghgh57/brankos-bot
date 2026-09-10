const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rig")
    .setDescription("Announce a rigged giveaway.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    )
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

    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageGuild
      )
    ) {
      return interaction.reply({
        content: "❌ You need the Manage Server permission to use this command.",
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
