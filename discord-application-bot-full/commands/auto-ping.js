const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");

const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("auto-ping")
    .setDescription(
      "Set the voice channel for automatic join pings."
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    )
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription(
          "The voice channel to monitor."
        )
        .addChannelTypes(
          ChannelType.GuildVoice
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel =
      interaction.options.getChannel(
        "channel"
      );

    config.autoPingChannelId =
      channel.id;

    await interaction.reply({
      content:
        `✅ Auto-ping channel set to ${channel}.`,
      ephemeral: true
    });
  }
};
