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
    if (!config.autoPingChannelId) {
      console.log(
        "❌ No autoPingChannelId is configured (run /auto-ping)."
      );
      return;
    }

    console.log(
      `🔎 Looking for auto-ping channel: ${config.autoPingChannelId}`
    );

    const pingChannel = await member.guild.channels
      .fetch(config.autoPingChannelId)
      .catch(error => {
        console.error(
          "❌ Could not fetch auto-ping channel:",
          error
        );

        return null;
      });

    if (!pingChannel) {
      console.log(
        `❌ Auto-ping channel ${config.autoPingChannelId} was not found.`
      );
      return;
    }

    if (!pingChannel.isTextBased()) {
      console.log(
        `❌ Auto-ping channel ${config.autoPingChannelId} is not text-based.`
      );
      return;
    }

    const pingMessage = await pingChannel
      .send({ content: `${member}` })
      .catch(error => {
        console.error(
          "❌ Could not send auto-ping message:",
          error
        );

        return null;
      });

    if (!pingMessage) return;

    console.log(
      `✅ Auto-ping sent for ${member.user?.tag || member.id} in #${pingChannel.name}`
    );

    // Delete the ping after 4 seconds
    setTimeout(() => {
      pingMessage.delete().catch(() => {});
    }, 4000);
  }
};
