const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  removeSticky
} = require("../stickyManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unstick")
    .setDescription("Remove the sticky message from this channel.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageMessages
    ),

  async execute(interaction) {
    const result = await removeSticky(
      interaction.channel
    );

    if (!result.success) {
      return interaction.reply({
        content: `❌ ${result.error}`,
        ephemeral: true
      });
    }

    await interaction.reply({
      content: "✅ Sticky message removed!",
      ephemeral: true
    });
  }
};
