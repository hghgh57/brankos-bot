const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const config = require("../config");

const autoPingFile = path.join(__dirname, "..", "autoping.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("auto-ping")
    .setDescription(
      "Set the text channel where new members get pinged on join."
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    )
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription(
          "The text channel to send the join ping in (pick from the list)."
        )
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName("channel_id")
        .setDescription(
          "Or paste a text channel ID directly."
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

      if (channel.type !== ChannelType.GuildText) {
        return interaction.reply({
          content:
            `❌ ${channel} isn't a text channel.`,
          ephemeral: true
        });
      }
    }

    config.autoPingChannelId = channel.id;

    fs.writeFileSync(
      autoPingFile,
      JSON.stringify({ channelId: channel.id }, null, 2)
    );

    await interaction.reply({
      content:
        `✅ Auto-ping channel set to ${channel}.`,
      ephemeral: true
    });
  }
};
