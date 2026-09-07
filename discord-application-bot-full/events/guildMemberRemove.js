const config = require("../config");

module.exports = {
  name: "guildMemberRemove",

  async execute(member) {
    try {
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

      // Leave message
      const channelId = config.leaveChannelId;

      if (!channelId) {
        console.log("❌ leaveChannelId is not set in config.js");
        return;
      }

      const channel = member.guild.channels.cache.get(channelId);

      if (!channel) {
        console.log(`❌ Leave channel not found: ${channelId}`);
        return;
      }

      if (!channel.isTextBased()) {
        console.log("❌ The leave channel is not a text channel.");
        return;
      }

      await channel.send(
        `${member.user.username} 𝐇𝐚𝐬 𝐋𝐞𝐟𝐭 𝐔𝐬... 𝐖𝐞 𝐇𝐨𝐩𝐞 𝐘𝐨𝐮 𝐂𝐨𝐦𝐞 𝐁𝐚𝐜𝐤 𝐒𝐨𝐨𝐧! 😢❤️`
      );

      console.log(
        `✅ Leave message sent for ${member.user.username}`
      );

      console.log(
        `Status: Watching over ${totalMembers} members`
      );

    } catch (error) {
      console.error("❌ Leave message error:", error);
    }
  }
};
