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
`__**staff application requirements:**__
 
- at least 14 years old 
- able to do **10m+ in giveaway** in a week 
- able to do **10+** partnerships a **week** 
- able to be really active in chat  
- must react daily to reactivity check 
- must be kind 
- must have <@&1500496895586336808> 
 
__**Partner manager requirements:**__ 
- at least 14 years old 
- you __must__ be able to find other servers who we can partner with. 
- able to do **10+** partnerships a **week** 
- you __must__ be experienced  
- follow are partner requirements  
- we __**do not**__ accept waves 
- you can only do **private waves / solo partners __only__! 
- you must react daily to reactivity check`
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
