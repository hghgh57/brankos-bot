const { EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = {
  name: "guildMemberRemove",

  async execute(member) {
    if (!config.leaveChannelId) return;

    const channel = member.guild.channels.cache.get(config.leaveChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setDescription(
        `**${member.user.username} Has Left Us...** We Hope You Come Back Soon! 😢❤️`
      )
      .setColor(0xED4245)
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(console.error);
  }
};
