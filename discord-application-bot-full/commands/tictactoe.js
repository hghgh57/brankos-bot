const { SlashCommandBuilder } = require("discord.js");
const { startGame } = require("../ticTacToeManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tictactoe")
    .setDescription("Challenge someone to a game of Tic-Tac-Toe.")
    .setDefaultMemberPermissions(null)
    .addUserOption(option =>
      option
        .setName("opponent")
        .setDescription("The user you want to play against.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const opponent = interaction.options.getUser("opponent", true);
    await startGame(interaction, opponent);
  }
};
