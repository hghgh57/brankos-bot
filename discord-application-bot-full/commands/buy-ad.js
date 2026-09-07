const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy-ad")
    .setDescription("Send the buy an ad ticket panel.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    ),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#0000FF")
      .setDescription("Buy an ad");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("service_ticket_open_buy_ad")
        .setLabel("Buy Ad")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: "✅ Buy ad panel sent!",
      ephemeral: true
    });
  }
};
