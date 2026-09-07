const config = require("../config");

module.exports = {
  name: "guildMemberAdd",

  async execute(member) {
    // Update bot member count
    const client = member.client;

    const totalMembers = client.guilds.cache.reduce(
      (total, guild) => total + guild.memberCount,
      0
    );

    client.user.setPresence({
      activities: [
        {
          name: `over ${totalMembers} members`,
          type: 3
        }
      ],
      status: "online"
    });

    // Welcome message
    if (!config.welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(
      config.welcomeChannelId
    );

    if (!channel) return;

    await channel.send(
      `𝐇𝐞𝐲 ${member}, 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 ${member.guild.name}! 🎉`
    ).catch(console.error);
  }
};
