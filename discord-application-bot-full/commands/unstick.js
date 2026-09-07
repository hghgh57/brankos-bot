const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  setSticky
} = require("../stickyManager");

module.exports = {
  data: new SlashCommandBuilder()
   .setName("unstick")
    .setDescription("Set a sticky message in this channel.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageMessages
    )
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("The message you want to stick.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const message =
      interaction.options.getString("message");

    const result = await setSticky(
      interaction.channel,
      message
    );

    if (!result.success) {
      return interaction.reply({
        content: `❌ ${result.error}`,
        ephemeral: true
      });
    }

    await interaction.reply({
      content: "✅ Sticky message set!",
      ephemeral: true
    });
  }
};
