const config = require("../config");

module.exports = {
  name: "voiceStateUpdate",

  async execute(oldState, newState) {
    try {
      // Only trigger when someone joins a voice channel
      if (
        !newState.channelId ||
        oldState.channelId === newState.channelId
      ) {
        return;
      }

      if (!config.autoPingChannelId) {
        return;
      }

      if (
        newState.channelId !==
        config.autoPingChannelId
      ) {
        return;
      }

      const channel = newState.channel;

      if (!channel || !channel.guild) {
        return;
      }

      // Send the ping in the server's system channel
      const message =
        await channel.guild.systemChannel
          ?.send({
            content:
              `<@${newState.member.id}> joined ${channel}.`
          })
          .catch(() => null);

      if (!message) {
        return;
      }

      // Delete the ping after 5 seconds
      setTimeout(() => {
        message.delete().catch(() => {});
      }, 5000);

    } catch (error) {
      console.error(
        "❌ Auto-ping error:",
        error
      );
    }
  }
};
