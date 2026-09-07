const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

const config = require("../config");

const BLUE = 0x0000FF;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-panel")
    .setDescription("Send the ticket panel.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    ),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle(config.tickets.panel.title)
      .setDescription(
        config.tickets.panel.description
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_support")
        .setLabel("Support")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("ticket_bug")
        .setLabel("Bug")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("ticket_partner")
        .setLabel("Partner")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("ticket_spawners")
        .setLabel("Buy/Sell Spawners")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("ticket_sponsor")
        .setLabel("Sponsor")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: "✅ Ticket panel sent!",
      ephemeral: true
    });
  }
};
