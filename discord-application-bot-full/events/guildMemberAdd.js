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
      `Hey ${member}, 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 ${member.guild.name}! 🎉`
    ).catch(console.error);
  }
};
