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

    const panel = config.tickets.panel;

    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle(panel.title)
      .setDescription(panel.description)
      .setFooter({ text: "Brankos community support" })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId("ticket_support")
        .setLabel(config.tickets.support.label)
        .setEmoji(config.tickets.support.emoji)
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("ticket_partner")
        .setLabel(config.tickets.partner.label)
        .setEmoji(config.tickets.partner.emoji)
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("ticket_spawners")
        .setLabel(config.tickets.spawners.label)
        .setEmoji(config.tickets.spawners.emoji)
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("ticket_sponsor")
        .setLabel(config.tickets.sponsor.label)
        .setEmoji(config.tickets.sponsor.emoji)
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
