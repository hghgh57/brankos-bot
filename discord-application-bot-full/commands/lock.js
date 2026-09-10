const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock this channel so only admins can send messages.")
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
          SendMessages: false,
          SendMessagesInThreads: false
        }
      );

      await interaction.reply({
        content: `🔒 ${channel} has been locked by ${interaction.user}`
      });
    } catch (err) {
      console.error("❌ Failed to lock channel:", err);
      await interaction.reply({
        content: "❌ Something went wrong while locking this channel. Make sure the bot has Manage Channels permission.",
        ephemeral: true
      });
    }
  }
};
