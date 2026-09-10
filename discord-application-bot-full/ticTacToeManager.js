const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const BLUE = 0x0000ff;

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];

function checkResult(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (
      board[a] !== "-" &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a]; // "X" or "O"
    }
  }

  if (!board.includes("-")) {
    return "draw";
  }

  return null;
}

function encodeState(board, turnId, p1Id, p2Id) {
  return `${board.join("")}_${turnId}_${p1Id}_${p2Id}`;
}

function decodeState(encoded) {
  const [boardStr, turnId, p1Id, p2Id] = encoded.split("_");
  return {
    board: boardStr.split(""),
    turnId,
    p1Id,
    p2Id
  };
}

function buildBoardComponents(board, cellPrefix, disabled) {
  const rows = [];

  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder();

    for (let c = 0; c < 3; c++) {
      const index = r * 3 + c;
      const value = board[index];

      const button = new ButtonBuilder()
        .setCustomId(`${cellPrefix}${index}`)
        .setLabel(value === "-" ? "\u200b" : value)
        .setStyle(
          value === "X"
            ? ButtonStyle.Danger
            : value === "O"
              ? ButtonStyle.Success
              : ButtonStyle.Secondary
        )
        .setDisabled(disabled || value !== "-");

      row.addComponents(button);
    }

    rows.push(row);
  }

  return rows;
}

function buildGameEmbed({ board, turnId, p1Id, p2Id, result }) {
  const embed = new EmbedBuilder().setColor(BLUE).setTitle("Tic-Tac-Toe");

  if (result === "draw") {
    embed.setDescription("It's a draw! 🤝");
  } else if (result === "X" || result === "O") {
    const winnerId = result === "X" ? p1Id : p2Id;
    embed.setDescription(`🎉 <@${winnerId}> wins!`);
  } else {
    embed.setDescription(
      `<@${p1Id}> (❌) vs <@${p2Id}> (⭕)\n\nIt's <@${turnId}>'s turn.`
    );
  }

  return embed;
}

async function startGame(interaction, opponent) {
  if (opponent.bot) {
    return interaction.reply({
      content: "❌ You can't play against a bot.",
      ephemeral: true
    });
  }

  if (opponent.id === interaction.user.id) {
    return interaction.reply({
      content: "❌ You can't play against yourself.",
      ephemeral: true
    });
  }

  const board = Array(9).fill("-");
  const p1Id = interaction.user.id;
  const p2Id = opponent.id;
  const turnId = p1Id;

  const state = encodeState(board, turnId, p1Id, p2Id);
  const cellPrefix = `ttt_${state}_`;

  const embed = buildGameEmbed({ board, turnId, p1Id, p2Id, result: null });
  const components = buildBoardComponents(board, cellPrefix, false);

  await interaction.reply({
    content: `<@${p1Id}> <@${p2Id}>`,
    embeds: [embed],
    components
  });
}

async function handleMove(interaction) {
  // customId format: ttt_{board}_{turnId}_{p1Id}_{p2Id}_{cellIndex}
  const raw = interaction.customId.slice("ttt_".length);
  const lastUnderscore = raw.lastIndexOf("_");
  const statePart = raw.slice(0, lastUnderscore);
  const cellIndex = parseInt(raw.slice(lastUnderscore + 1), 10);

  const { board, turnId, p1Id, p2Id } = decodeState(statePart);

  if (interaction.user.id !== turnId) {
    return interaction.reply({
      content: "❌ It's not your turn.",
      ephemeral: true
    });
  }

  if (board[cellIndex] !== "-") {
    return interaction.reply({
      content: "❌ That spot is already taken.",
      ephemeral: true
    });
  }

  const symbol = turnId === p1Id ? "X" : "O";
  board[cellIndex] = symbol;

  const result = checkResult(board);
  const nextTurnId = turnId === p1Id ? p2Id : p1Id;

  const embed = buildGameEmbed({
    board,
    turnId: nextTurnId,
    p1Id,
    p2Id,
    result
  });

  const newState = encodeState(board, nextTurnId, p1Id, p2Id);
  const cellPrefix = `ttt_${newState}_`;
  const gameOver = result !== null;
  const components = buildBoardComponents(board, cellPrefix, gameOver);

  await interaction.update({
    embeds: [embed],
    components
  });
}

module.exports = {
  startGame,
  handleMove
};
