const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const { getSponsorTotal, formatAmount } = require("../sponsorManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sponsor-check")
    .setDescription("Check a user's total sponsored amount.")
    .setDefaultMemberPermissions(null)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to check. Defaults to you.")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }

    const user = interaction.options.getUser("user") || interaction.user;
    const total = getSponsorTotal(user.id);
    const totalDisplay = formatAmount(total);

    const embed = new EmbedBuilder()
      .setColor(0x0000ff)
      .setTitle("Sponsor Check")
      .setDescription(
        `**User :** ${user}\n` +
        `**Total Sponsored :** ${totalDisplay}`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }
};
