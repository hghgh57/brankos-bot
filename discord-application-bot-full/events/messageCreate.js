const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
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

      // Delete the old sticky message if one exists
      const oldSticky = stickyMessages.get(message.channel.id);

      if (oldSticky) {
        const oldMessage = await message.channel.messages
          .fetch(oldSticky)
          .catch(() => null);

        if (oldMessage) {
          await oldMessage.delete().catch(() => {});
        }
      }

      // Send the new sticky embed
      const embed = new EmbedBuilder()
        .setColor(BLUE)
        .setDescription(stickMessage);

      const sticky = await message.channel.send({
        embeds: [embed]
      });

      // Save the sticky message
      stickyMessages.set(
        message.channel.id,
        sticky.id
      );

      // Delete the .stick command
      await message.delete().catch(() => {});

      return;
    }

    /*
     * STICKY MESSAGE SYSTEM
     */

    const stickyId = stickyMessages.get(message.channel.id);

    if (!stickyId) return;

    const stickyMessage = await message.channel.messages
      .fetch(stickyId)
      .catch(() => null);

    if (stickyMessage) {
      await stickyMessage.delete().catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setDescription(
        stickyMessage?.embeds?.[0]?.description || ""
      );

    // Get the saved sticky text directly from the previous message
    const stickyData = stickyMessages.get(
      `${message.channel.id}_content`
    );

    if (stickyData) {
      embed.setDescription(stickyData);
    }

    const newSticky = await message.channel.send({
      embeds: [embed]
    });

    stickyMessages.set(
      message.channel.id,
      newSticky.id
    );
  }
};
