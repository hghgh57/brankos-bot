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
          "The voice channel to monitor (pick from the list)."
        )
        .addChannelTypes(
          ChannelType.GuildVoice
        )
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName("channel_id")
        .setDescription(
          "Or paste a voice channel ID directly."
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    const pickedChannel =
      interaction.options.getChannel("channel");

    const typedId =
      interaction.options.getString("channel_id");

    if (!pickedChannel && !typedId) {
      return interaction.reply({
        content:
          "❌ Provide either `channel` or `channel_id`.",
        ephemeral: true
      });
    }

    let channel = pickedChannel;

    if (!channel && typedId) {
      const id = typedId.trim();

      if (!/^\d{17,20}$/.test(id)) {
        return interaction.reply({
          content:
            "❌ That doesn't look like a valid channel ID (should be a 17-20 digit number).",
          ephemeral: true
        });
      }

      channel = await interaction.guild.channels
        .fetch(id)
        .catch(() => null);

      if (!channel) {
        return interaction.reply({
          content:
            "❌ I couldn't find a channel with that ID in this server.",
          ephemeral: true
        });
      }

      if (channel.type !== ChannelType.GuildVoice) {
        return interaction.reply({
          content:
            `❌ ${channel} isn't a voice channel.`,
          ephemeral: true
        });
      }
    }

    config.autoPingChannelId = channel.id;

    await interaction.reply({
      content:
        `✅ Auto-ping channel set to ${channel}.`,
      ephemeral: true
    });
  }
};
