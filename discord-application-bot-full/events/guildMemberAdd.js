const config = require("../config");

module.exports = {
  name: "guildMemberAdd",

  async execute(member) {
    if (!config.welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(
      config.welcomeChannelId
    );

    if (!channel) return;

    await channel.send(
      `Hey ${member}, Welcome To ${member.guild.name}! 🎉`
    ).catch(console.error);
  }
};
