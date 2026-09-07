const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("service-tickets")
    .setDescription("Send the service ticket panel.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    ),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#0000FF")
      .setDescription(
        config.tickets?.panel?.description ||
        "Thanks for reaching out, feel free to make a ticket.\n\n" +
        "Click a button below to open a ticket in the relevant category.\n\n" +
        "Only open a ticket if you genuinely need help."
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("service_ticket_open_dig_out")
        .setLabel("Dig Out")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("service_ticket_open_request_build")
        .setLabel("Request Build")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: "✅ Service ticket panel sent!",
      ephemeral: true
    });
  }
};
