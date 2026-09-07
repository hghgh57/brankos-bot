const { EmbedBuilder } = require("discord.js");
const config = require("../config");

const BLUE = 0x0000FF;

// Sticky messages stored per channel
const stickyMessages = new Map();

module.exports = {
  name: "messageCreate",

  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild || !message.member) return;

    const content = message.content.trim();

    /*
     * .paidad
     */

    if (content.toLowerCase() === ".paidad") {
      if (!message.member.permissions.has("ManageMessages")) {
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(BLUE)
        .setTitle(config.paidAd.title)
        .setDescription(config.paidAd.message)
        .setTimestamp();

      await message.channel.send({
        embeds: [embed]
      });

      return;
    }

    /*
     * .stick
     */

    if (content.toLowerCase().startsWith(".stick")) {
      if (!message.member.permissions.has("ManageMessages")) {
        return;
      }

      const stickMessage = content.slice(6).trim();

      if (!stickMessage) {
        await message.reply(
          "❌ Please provide a message to make sticky."
        );
        return;
      }

      const oldSticky = stickyMessages.get(
        message.channel.id
      );

      if (oldSticky) {
        const oldMessage = await message.channel.messages
          .fetch(oldSticky.id)
          .catch(() => null);

        if (oldMessage) {
          await oldMessage.delete().catch(() => {});
        }
      }

      const embed = new EmbedBuilder()
        .setColor(BLUE)
        .setDescription(stickMessage);

      const sticky = await message.channel.send({
        embeds: [embed]
      });

      stickyMessages.set(message.channel.id, {
        id: sticky.id,
        content: stickMessage
      });

      await message.delete().catch(() => {});

      return;
    }

    /*
     * STICKY MESSAGE
     */

    const sticky = stickyMessages.get(
      message.channel.id
    );

    if (!sticky) return;

    const oldStickyMessage = await message.channel.messages
      .fetch(sticky.id)
      .catch(() => null);

    if (oldStickyMessage) {
      await oldStickyMessage.delete().catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setDescription(sticky.content);

    const newSticky = await message.channel.send({
      embeds: [embed]
    });

    stickyMessages.set(message.channel.id, {
      id: newSticky.id,
      content: sticky.content
    });
  }
};
