const { EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = {
  name: "guildMemberAdd",

  async execute(member) {
    if (!config.welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setDescription(`Hey ${member}, **Welcome To ${member.guild.name}!** 🎉`)
      .setColor(0x5865F2)
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(console.error);
  }
};
