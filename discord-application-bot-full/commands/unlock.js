const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock this channel so everyone can send messages again.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  async execute(interaction) {
    // Extra safety check in case default perms get overridden in server settings
    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.Administrator
      )
    ) {
      return interaction.reply({
        content: "❌ You need Administrator permission to use this.",
        ephemeral: true
      });
    }

    const channel = interaction.channel;

    try {
      await channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        {
          SendMessages: null,
          SendMessagesInThreads: null
        }
      );

      await interaction.reply({
        content: "🔓 This channel has been unlocked. Everyone can send messages again."
      });
    } catch (err) {
      console.error("❌ Failed to unlock channel:", err);
      await interaction.reply({
        content: "❌ Something went wrong while unlocking this channel. Make sure the bot has Manage Channels permission.",
        ephemeral: true
      });
    }
  }
};
