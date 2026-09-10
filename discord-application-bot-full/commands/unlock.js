const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock this channel so everyone can send messages again.")
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
          SendMessages: null,
          SendMessagesInThreads: null
        }
      );

      const embed = new EmbedBuilder()
        .setColor(0x0000ff)
        .setDescription(`${channel} has been unlocked by ${interaction.user}`);

      await interaction.reply({
        embeds: [embed]
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
