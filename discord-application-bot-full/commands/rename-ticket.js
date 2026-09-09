const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const RENAME_ROLE_ID = "1484216939466461376";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rename-ticket")
    .setDescription("Rename the current ticket.")
    .addStringOption(option =>
      option
        .setName("name")
        .setDescription("The new name for the ticket.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.channel;

    const hasRole = interaction.member.roles.cache.has(
      RENAME_ROLE_ID
    );
    const hasManageChannels =
      interaction.member.permissions.has(
        PermissionFlagsBits.ManageChannels
      );

    if (!hasRole && !hasManageChannels) {
      return interaction.reply({
        content:
          "❌ You do not have permission to use this command.",
        ephemeral: true
      });
    }

    const newName =
      interaction.options
        .getString("name")
        .trim();

    if (
      !channel ||
      !channel.topic ||
      !channel.topic.startsWith("ticket:")
    ) {
      return interaction.reply({
        content:
          "❌ This command can only be used inside a ticket.",
        ephemeral: true
      });
    }

    if (!newName) {
      return interaction.reply({
        content:
          "❌ Please provide a ticket name.",
        ephemeral: true
      });
    }

    const safeName = newName
      .toLowerCase()
      .replace(/[^a-z0-9- ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 90);

    if (!safeName) {
      return interaction.reply({
        content:
          "❌ That is not a valid ticket name.",
        ephemeral: true
      });
    }

    await channel.setName(safeName);

    await interaction.reply({
      content:
        `✅ Ticket renamed to \`${safeName}\`.`,
      ephemeral: true
    });
  }
};
