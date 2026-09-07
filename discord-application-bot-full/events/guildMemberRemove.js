const config = require("../config");

console.log("✅ guildMemberRemove.js loaded");

module.exports = {
  name: "guildMemberRemove",

  async execute(member) {
    console.log(
      `🚪 MEMBER LEAVE EVENT FIRED: ${member.user.tag} (${member.id}) left ${member.guild.name} (${member.guild.id})`
    );

    try {
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

      const channel =
        await member.guild.channels
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
          `❌ Leave channel ${channelId} was not found in ${member.guild.name}.`
        );
        return;
      }

      if (!channel.isTextBased()) {
        console.log(
          `❌ Leave channel ${channelId} is not a text-based channel.`
        );
        return;
      }

      console.log(
        `✅ Leave channel found: ${channel.name}`
      );

      const username =
        member.user.username;

      await channel.send(
        `${username} Has Left Us... We Hope You Come Back Soon! 😢❤️`
      );

      console.log(
        `✅ Leave message sent for ${username}!`
      );

      // Update member count
      const totalMembers =
        member.client.guilds.cache.reduce(
          (total, guild) =>
            total + guild.memberCount,
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
