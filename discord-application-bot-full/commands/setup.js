const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

const BLUE = 0x0000FF;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Send the application panel.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    ),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setDescription(
`__**Staff Application requirements:**__

• at least 14 years old
• able to do **10+ partnerships a week.**
• able to do **10M+ in giveaway** in a week
• able to be really active in chat
• must be **experienced**
• must react daily to reactivity check
• must be kind
• must have <@&COAL_MINER_ROLE_ID>

__**Partner Manager requirements**__

• at least 14 years old
• you **must** be able to find other servers who we can partner with.
• able to do **10+ partnerships a week.**
• you **must** be experienced
• **Follow** our Partner requirements
• We **do not** accept waves
• You can only do **private wave / solo partners only!**`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("application_staff")
        .setLabel("Staff Application")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("application_partner")
        .setLabel("Partner Manager Application")
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
      content: "✅ Application panel sent!",
      ephemeral: true
    });
  }
};
