const { EmbedBuilder } = require("discord.js");
const config = require("../config");

const BLUE = 0x0000FF;

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
        return;
      }

      const sentMessage = await message.channel.send(stickMessage);

      await sentMessage.pin().catch(error => {
        console.error("❌ Could not pin stick message:", error);
      });

      return;
    }
  }
};
