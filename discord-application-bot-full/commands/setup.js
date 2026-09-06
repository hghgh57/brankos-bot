const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-applications")
    .setDescription("Send the application panel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("Applications")
      .setDescription(
        "Choose an application below to apply.\n\n" +
        "You will receive the application in your DMs. " +
        "Answer each question one at a time. Type `cancel` at any time to cancel."
      )
      .setColor(0x5865F2);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("application_staff")
        .setLabel("Staff Application")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("application_partner")
        .setLabel("Partner Manager")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("application_builder")
        .setLabel("Builder Application")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: "Application panel sent.",
      ephemeral: true
    });
  }
};
