const config = require("../config");

console.log("✅ guildMemberRemove.js loaded");

module.exports = {
  name: "guildMemberRemove",

  async execute(member) {
    console.log(
      `🚪 MEMBER LEAVE EVENT FIRED: ${member.user?.tag || member.id} (${member.id}) left ${member.guild.name} (${member.guild.id})`
    );

    try {
      // ================================
      // FIND LEAVE CHANNEL
      // ================================

      const channelId = config.leaveChannelId;

      if (!channelId) {
        console.log(
          "❌ No leaveChannelId is configured in config.js"
        );
        return;
      }

      console.log(
        `🔎 Looking for leave channel: ${channelId}`
      );

      const channel = await member.guild.channels
        .fetch(channelId)
        .catch(error => {
          console.error(
            "❌ Could not fetch leave channel:",
            error
          );

          return null;
        });

      if (!channel) {
        console.log(
          `❌ Leave channel ${channelId} was not found.`
        );
        return;
      }

      if (!channel.isTextBased()) {
        console.log(
          `❌ Leave channel ${channelId} is not text-based.`
        );
        return;
      }

      console.log(
        `✅ Leave channel found: ${channel.name}`
      );

      // ================================
      // SEND LEAVE MESSAGE
      // ================================

      const username =
        member.user?.username || "Someone";

      await channel.send(
        `${username} 𝐇𝐚𝐬 𝐋𝐞𝐟𝐭 𝐔𝐬... 𝐖𝐞 𝐇𝐨𝐩𝐞 𝐘𝐨𝐮 𝐂𝐨𝐦𝐞 𝐁𝐚𝐜𝐤 𝐒𝐨𝐨𝐧 😢❤️`
      );

      console.log(
        `✅ Leave message sent for ${username}!`
      );

      // ================================
      // UPDATE MEMBER COUNT
      // ================================

      let totalMembers = 0;

      for (const guild of member.client.guilds.cache.values()) {
        totalMembers += guild.memberCount || 0;
      }

      if (member.client.user) {
        await member.client.user.setPresence({
          activities: [
            {
              name: `over ${totalMembers} members`,
              type: 3
            }
          ],
          status: "online"
        });
      }

      console.log(
        `👀 Status updated: Watching over ${totalMembers} members`
      );

    } catch (error) {
      console.error(
        "❌ LEAVE EVENT ERROR:",
        error
      );
    }
  }
};
