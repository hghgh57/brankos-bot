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
    .setName("advertisement-info")
    .setDescription("Post the paid advertisement info with pricing buttons.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setDescription(config.paidAd.message)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("adinfo_member_visibility")
        .setLabel("Member Visibility")
        .setEmoji("<:1513266373743218818:1531297976314630214>")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("adinfo_bundles")
        .setLabel("Bundles")
        .setEmoji("<:Box:1548317902283870268>")
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
