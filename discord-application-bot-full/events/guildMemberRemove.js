const config = require("../config");

module.exports = {
  name: "guildMemberRemove",

  async execute(member) {
    try {
      const channelId = config.leaveChannelId;

      if (!channelId) {
        console.log("❌ leaveChannelId is not set in config.js");
        return;
      }

      const channel = await member.guild.channels.fetch(channelId).catch(() => null);

      if (!channel) {
        console.log(`❌ Leave channel not found: ${channelId}`);
        return;
      }

      if (!channel.isTextBased()) {
        console.log("❌ Leave channel is not a text channel.");
        return;
      }

      await channel.send(
        `${member.user.username} Has Left Us... We Hope You Come Back Soon! 😢❤️`
      );

      console.log(
        `✅ Leave message sent for ${member.user.username}`
      );

      // Update member count
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

    } catch (error) {
      console.error("❌ Leave message error:", error);
    }
  }
};
