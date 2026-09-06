const { EmbedBuilder } = require("discord.js");
const config = require("../config");

const BLUE = 0x0000ff;

module.exports = {
  name: "messageCreate",

  async execute(message) {
    // Ignore bots
    if (message.author.bot) return;

    // Only respond to .paidad
    if (message.content.toLowerCase().trim() !== ".paidad") return;

    // Only people with Manage Messages can use it
    if (
      message.guild &&
      !message.member.permissions.has("ManageMessages")
    ) {
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
  }
};
