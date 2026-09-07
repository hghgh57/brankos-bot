const config = require("../config");

console.log("✅ guildMemberRemove.js loaded");

module.exports = {
  name: "guildMemberRemove",

  async execute(member) {
    console.log(
      `🚪 MEMBER LEAVE EVENT: ${member.user.tag} left ${member.guild.name}`
    );

    try {
      const channel = await member.guild.channels.fetch(
        config.leaveChannelId
      );

      if (!channel) {
        console.log("❌ Leave channel not found.");
        return;
      }

      await channel.send(
        `${member.user.username} Has Left Us... We Hope You Come Back Soon! 😢❤️`
      );

      console.log("✅ Leave message sent!");

      // Update member count
      const totalMembers = member.client.guilds.cache.reduce(
        (total, guild) => total + guild.memberCount,
        0
      );

      member.client.user.setPresence({
        activities: [
          {
            name: `over ${totalMembers} members`,
            type: 3
          }
        ],
        status: "online"
      });

    } catch (error) {
      console.error("❌ Leave event error:", error);
    }
  }
};
