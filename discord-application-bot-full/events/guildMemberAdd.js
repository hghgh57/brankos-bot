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
    if (config.welcomeChannelId) {
      const channel = member.guild.channels.cache.get(
        config.welcomeChannelId
      );

      if (channel) {
        await channel.send(
          `𝐇𝐞𝐲 ${member}, 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 ${member.guild.name}! 🎉`
        ).catch(console.error);
      }
    }

    // Auto-ping in the configured text channel
    if (!config.autoPingChannelId) return;

    const pingChannel = member.guild.channels.cache.get(
      config.autoPingChannelId
    );

    if (!pingChannel) return;

    const pingMessage = await pingChannel
      .send({ content: `${member}` })
      .catch(() => null);

    if (!pingMessage) return;

    // Delete the ping after 2 seconds
    setTimeout(() => {
      pingMessage.delete().catch(() => {});
    }, 2000);
  }
};
