const { SlashCommandBuilder } = require("discord.js");
const config = require("../config");
const { startGame } = require("../rpsManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rps-duel")
    .setDescription("Start a rock paper scissors match between two users.")
    .setDefaultMemberPermissions(null)
    .addUserOption(option =>
      option
        .setName("player1")
        .setDescription("The first player.")
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName("player2")
        .setDescription("The second player.")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }

    const hasStaffRole = interaction.member.roles.cache.has(
      config.staffRoleId
    );

    if (!hasStaffRole) {
      return interaction.reply({
        content: "❌ You don't have permission to use this command.",
        ephemeral: true
      });
    }

    const player1 = interaction.options.getUser("player1", true);
    const player2 = interaction.options.getUser("player2", true);

    await startGame(interaction, player1, player2);
  }
};
