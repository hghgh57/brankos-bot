const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const config = require("../config");

const BLUE = 0x0000FF;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-tickets")
    .setDescription("Send the ticket panel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle("🎫 Ticket Support")
      .setDescription(
        "Need help? Open a ticket using one of the buttons below.\n\n" +
        "🔴 **Support**\n" +
        "For general support and help.\n\n" +
        "🟢 **Partner**\n" +
        "For partnership related requests.\n\n" +
        "🟢 **Buy/Sell Spawners**\n" +
        "For buying or selling spawners.\n\n" +
        "🔵 **Sponsor**\n" +
        "For sponsorship related requests.\n\n" +
        "Please only open a ticket if you need assistance."
      )
      .setFooter({
        text: "Ticket System"
      })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_support")
        .setLabel("Support")
        .setEmoji("🔴")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("ticket_partner")
        .setLabel("Partner")
        .setEmoji("🟢")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("ticket_spawners")
        .setLabel("Buy/Sell Spawners")
        .setEmoji("🟢")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("ticket_sponsor")
        .setLabel("Sponsor")
        .setEmoji("🔵")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({
      embeds: [embed],
      components: [row1]
    });

    await interaction.reply({
      content: "✅ Ticket panel sent.",
      ephemeral: true
    });
  }
};
