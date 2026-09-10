const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Flip a coin.")
    .setDefaultMemberPermissions(null),

  async execute(interaction) {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    const emoji = result === "Heads" ? "🪙" : "🌑";

    const embed = new EmbedBuilder()
      .setColor(0x0000ff)
      .setTitle("Coinflip")
      .setDescription(`${emoji} The coin landed on **${result}**!`);

    await interaction.reply({
      embeds: [embed]
    });
  }
};
