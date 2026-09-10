const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock this channel so only admins can send messages.")
    .setDefaultMemberPermissions(null),

  async execute(interaction) {
    const hasPermission = interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    );
    const hasStaffRole = interaction.member.roles.cache.has(
      config.staffRoleId
    );

    if (!hasPermission && !hasStaffRole) {
      return interaction.reply({
        content: "❌ You need Administrator permission (or the staff role) to use this.",
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

      const embed = new EmbedBuilder()
        .setColor(0x0000ff)
        .setDescription(`${channel} has been locked by ${interaction.user}`);

      await interaction.reply({
        embeds: [embed]
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
