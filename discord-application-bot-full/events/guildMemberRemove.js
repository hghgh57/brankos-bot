const config = require("../config");

module.exports = {
  name: "guildMemberRemove",

  async execute(member) {
    if (!config.leaveChannelId) return;

    const channel = member.guild.channels.cache.get(
      config.leaveChannelId
    );

    if (!channel) return;

    await channel.send(
      `${member.user.username} Has Left Us... We Hope You Come Back Soon! 😢❤️`
    ).catch(console.error);
  }
};
