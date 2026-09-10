const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const BLUE = 0x0000ff;

// gameId -> { p1Id, p2Id, picks: { [userId]: "rock" | "paper" | "scissors" }, timeout }
const games = new Map();

const CHOICES = {
  rock: { label: "Rock", emoji: "" },
  paper: { label: "Paper", emoji: "" },
  scissors: { label: "Scissors", emoji: "" }
};

// How long a match can sit unfinished before it's auto-expired.
const GAME_TIMEOUT_MS = 5 * 60 * 1000;

function decideWinner(pick1, pick2) {
  if (pick1 === pick2) return "draw";

  const beats = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper"
  };

  return beats[pick1] === pick2 ? "p1" : "p2";
}

function buildChoiceButtons(gameId, disabled = false) {
  const row = new ActionRowBuilder();

  for (const key of Object.keys(CHOICES)) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`rps_pick_${gameId}_${key}`)
        .setLabel(CHOICES[key].label)
        .setEmoji(CHOICES[key].emoji)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled)
    );
  }

  return [row];
}

function buildWaitingEmbed({ p1Id, p2Id, picks }) {
  const p1Done = Boolean(picks[p1Id]);
  const p2Done = Boolean(picks[p2Id]);

  return new EmbedBuilder()
    .setColor(BLUE)
    .setTitle("Rock Paper Scissors")
    .setDescription(
      `<@${p1Id}> vs <@${p2Id}>\n\n` +
      `${p1Done ? "" : "⏳"} <@${p1Id}> has ${p1Done ? "chosen" : "not chosen yet"}\n` +
      `${p2Done ? "" : "⏳"} <@${p2Id}> has ${p2Done ? "chosen" : "not chosen yet"}\n\n` +
      `Choices are hidden until both players pick.`
    );
}

function buildResultEmbed({ p1Id, p2Id, picks }) {
  const pick1 = picks[p1Id];
  const pick2 = picks[p2Id];
  const outcome = decideWinner(pick1, pick2);

  const line1 = `<@${p1Id}> chose **${CHOICES[pick1].label}** ${CHOICES[pick1].emoji}`;
  const line2 = `<@${p2Id}> chose **${CHOICES[pick2].label}** ${CHOICES[pick2].emoji}`;

  let resultLine;
  if (outcome === "draw") {
    resultLine = "🤝 It's a draw!";
  } else if (outcome === "p1") {
    resultLine = `🎉 <@${p1Id}> wins!`;
  } else {
    resultLine = `🎉 <@${p2Id}> wins!`;
  }

  return new EmbedBuilder()
    .setColor(BLUE)
    .setTitle("Rock Paper Scissors")
    .setDescription(`${line1}\n${line2}\n\n${resultLine}`);
}

async function startGame(interaction, player1, player2) {
  if (player1.bot || player2.bot) {
    return interaction.reply({
      content: "❌ You can't play against a bot.",
      ephemeral: true
    });
  }

  if (player1.id === player2.id) {
    return interaction.reply({
      content: "❌ Those need to be two different users.",
      ephemeral: true
    });
  }

  const gameId = `${interaction.id}`;

  const timeout = setTimeout(() => {
    const game = games.get(gameId);
    if (!game) return;

    games.delete(gameId);

    interaction
      .editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(BLUE)
            .setTitle("Rock Paper Scissors")
            .setDescription("⌛ This match expired because both players didn't pick in time.")
        ],
        components: buildChoiceButtons(gameId, true)
      })
      .catch(() => {});
  }, GAME_TIMEOUT_MS);

  games.set(gameId, {
    p1Id: player1.id,
    p2Id: player2.id,
    picks: {},
    timeout
  });

  const embed = buildWaitingEmbed({
    p1Id: player1.id,
    p2Id: player2.id,
    picks: {}
  });

  await interaction.reply({
    content: `<@${player1.id}> <@${player2.id}>`,
    embeds: [embed],
    components: buildChoiceButtons(gameId, false)
  });
}

async function handleChoice(interaction) {
  // customId format: rps_pick_{gameId}_{choice}
  const raw = interaction.customId.slice("rps_pick_".length);
  const lastUnderscore = raw.lastIndexOf("_");
  const gameId = raw.slice(0, lastUnderscore);
  const choice = raw.slice(lastUnderscore + 1);

  const game = games.get(gameId);

  if (!game) {
    return interaction.reply({
      content: "❌ This match has expired or already finished.",
      ephemeral: true
    });
  }

  const { p1Id, p2Id, picks } = game;

  if (interaction.user.id !== p1Id && interaction.user.id !== p2Id) {
    return interaction.reply({
      content: "❌ This isn't your match.",
      ephemeral: true
    });
  }

  if (picks[interaction.user.id]) {
    return interaction.reply({
      content: "❌ You've already made your choice for this match.",
      ephemeral: true
    });
  }

  picks[interaction.user.id] = choice;

  await interaction.reply({
    content: `You chose **${CHOICES[choice].label}** ${CHOICES[choice].emoji}`,
    ephemeral: true
  });

  const bothPicked = Boolean(picks[p1Id]) && Boolean(picks[p2Id]);

  if (!bothPicked) {
    const waitingEmbed = buildWaitingEmbed({ p1Id, p2Id, picks });

    await interaction.message
      .edit({
        embeds: [waitingEmbed],
        components: buildChoiceButtons(gameId, false)
      })
      .catch(() => {});

    return;
  }

  clearTimeout(game.timeout);
  games.delete(gameId);

  const resultEmbed = buildResultEmbed({ p1Id, p2Id, picks });

  await interaction.message
    .edit({
      embeds: [resultEmbed],
      components: buildChoiceButtons(gameId, true)
    })
    .catch(() => {});
}

module.exports = {
  startGame,
  handleChoice
};
