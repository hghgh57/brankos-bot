const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// giveawayManager is required lazily inside functions (not at the top of
// this file) purely as a style match with giveawayManager's own lazy
// require of this file — either order works fine here since there's no
// real circular dependency (this file only calls into giveawayManager,
// it never gets called by it at load time).
const giveawayManager = require("./giveawayManager");

const BLUE = 0x0000ff;
const CHOICES = ["rock", "paper", "scissors"];

// How long each round gives the players to pick before it's decided
// automatically (single pick = auto-win, no picks = draw).
const PICK_TIMEOUT_MS = 5 * 60 * 1000;

// Keyed by giveawayId.
const duels = new Map();

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Returns "p1", "p2", or "tie".
function resolveRound(p1Choice, p2Choice) {
  if (p1Choice === p2Choice) return "tie";

  const beats = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper"
  };

  return beats[p1Choice] === p2Choice ? "p1" : "p2";
}

function buildChoiceButtons(duel, disabled = false) {
  const row = new ActionRowBuilder();

  for (const choice of CHOICES) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`rps_choice_${duel.giveawayId}_${choice}`)
        .setLabel(capitalize(choice))
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled)
    );
  }

  return [row];
}

function buildDuelEmbed(
  duel,
  { tie = false, finished = false, winnerId = null, draw = false, timedOut = false } = {}
) {
  const embed = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle(`Rock Paper Scissors — ${duel.prize}`);

  if (draw) {
    embed.setDescription(
      `<@${duel.p1}> vs <@${duel.p2}>\n\n` +
      "**Neither player picked in time — the duel ends in a draw. No prize awarded.**"
    );

    return embed;
  }

  if (finished) {
    const choices = duel.finalChoices || duel.choices || {};
    const p1Choice = choices[duel.p1] ? capitalize(choices[duel.p1]) : "No pick";
    const p2Choice = choices[duel.p2] ? capitalize(choices[duel.p2]) : "No pick";

    const lines = [
      `<@${duel.p1}> chose ${p1Choice}`,
      `<@${duel.p2}> chose ${p2Choice}`,
      "",
      `**<@${winnerId}> wins the duel!**`
    ];

    if (timedOut) {
      lines.push("-# The other player didn't pick in time.");
    }

    embed.setDescription(lines.join("\n"));

    return embed;
  }

  const p1Status = duel.choices[duel.p1] ? "Locked in" : "Waiting on a pick";
  const p2Status = duel.choices[duel.p2] ? "Locked in" : "Waiting on a pick";

  const lines = [
    `<@${duel.p1}> vs <@${duel.p2}>`,
    "",
    "Both winners must choose Rock, Paper, or Scissors below.",
    "Picks stay hidden until both players have chosen.",
    "You have 5 minutes to pick each round.",
    "",
    `<@${duel.p1}>: ${p1Status}`,
    `<@${duel.p2}>: ${p2Status}`
  ];

  if (tie) {
    lines.push("", "**It's a tie — pick again!**");
  }

  embed.setDescription(lines.join("\n"));

  return embed;
}

async function updateDuelMessage(client, duel, opts = {}) {
  try {
    const channel = client.channels.cache.get(duel.channelId);
    if (!channel) return;

    const message = await channel.messages.fetch(duel.messageId);

    await message.edit({
      embeds: [buildDuelEmbed(duel, opts)],
      components: buildChoiceButtons(duel, false)
    });
  } catch (error) {
    console.error("RPS duel update error:", error);
  }
}

// (Re)arms the 5-minute pick timer for the current round of a duel.
function armTimeout(client, duel) {
  if (duel.timeout) {
    clearTimeout(duel.timeout);
  }

  duel.timeout = setTimeout(() => {
    handleTimeout(client, duel).catch(error => {
      console.error("RPS duel timeout handler error:", error);
    });
  }, PICK_TIMEOUT_MS);
}

// Called 5 minutes after a round starts (or restarts after a tie) if
// both players still haven't both picked.
async function handleTimeout(client, duel) {
  // The duel may have already finished normally in the meantime.
  if (duels.get(duel.giveawayId) !== duel) return;

  duels.delete(duel.giveawayId);

  const p1Picked = !!duel.choices[duel.p1];
  const p2Picked = !!duel.choices[duel.p2];

  duel.finalChoices = { ...duel.choices };

  try {
    const channel = client.channels.cache.get(duel.channelId);
    if (!channel) return;

    const message = await channel.messages.fetch(duel.messageId);

    // Neither player picked — the duel just dies as a draw.
    if (!p1Picked && !p2Picked) {
      await message.edit({
        content: `⏱️ <@${duel.p1}> and <@${duel.p2}> both failed to pick in time — the duel ends in a draw.`,
        embeds: [buildDuelEmbed(duel, { draw: true })],
        components: buildChoiceButtons(duel, true)
      });

      return;
    }

    // Exactly one player picked — they win by default.
    const winnerId = p1Picked ? duel.p1 : duel.p2;
    const loserId = p1Picked ? duel.p2 : duel.p1;

    await message.edit({
      content: `⏱️ <@${loserId}> didn't pick in time — <@${winnerId}> wins by default!`,
      embeds: [buildDuelEmbed(duel, { finished: true, winnerId, timedOut: true })],
      components: buildChoiceButtons(duel, true)
    });

    await giveawayManager.finalizeGiveawayWinner(client, duel.giveawayId, winnerId);
  } catch (error) {
    console.error("Could not resolve timed-out RPS duel:", error);
  }
}

// Called by giveawayManager once a giveaway ends with exactly 2 winners
// and is flagged isRps. Takes over the original giveaway message and
// turns it into the duel.
async function startDuel(client, giveaway) {
  const duel = {
    giveawayId: giveaway.id,
    channelId: giveaway.channelId,
    messageId: giveaway.messageId,
    prize: giveaway.baseName || giveaway.prize,
    p1: giveaway.winners[0],
    p2: giveaway.winners[1],
    choices: {},
    finalChoices: null,
    timeout: null
  };

  duels.set(duel.giveawayId, duel);

  try {
    const channel = client.channels.cache.get(duel.channelId);
    if (!channel) return;

    const message = await channel.messages.fetch(duel.messageId);

    await message.edit({
      content: `🎉 <@${duel.p1}> <@${duel.p2}> — you both won! Time for a duel.`,
      embeds: [buildDuelEmbed(duel)],
      components: buildChoiceButtons(duel, false)
    });

    armTimeout(client, duel);
  } catch (error) {
    console.error("Could not start RPS duel:", error);
  }
}

async function finishDuel(client, duel, winnerId) {
  if (duel.timeout) {
    clearTimeout(duel.timeout);
    duel.timeout = null;
  }

  duel.finalChoices = { ...duel.choices };

  try {
    const channel = client.channels.cache.get(duel.channelId);
    if (channel) {
      const message = await channel.messages.fetch(duel.messageId);

      await message.edit({
        embeds: [buildDuelEmbed(duel, { finished: true, winnerId })],
        components: buildChoiceButtons(duel, true)
      });
    }
  } catch (error) {
    console.error("Could not finish RPS duel:", error);
  }

  duels.delete(duel.giveawayId);

  // Hand off to giveawayManager to send the normal giveaway win message
  // (with the Claim button) for the duel winner.
  await giveawayManager.finalizeGiveawayWinner(client, duel.giveawayId, winnerId);
}

async function handleChoice(interaction) {
  // customId format: rps_choice_{giveawayId}_{choice}
  const rest = interaction.customId.slice("rps_choice_".length);
  const lastUnderscore = rest.lastIndexOf("_");
  const giveawayId = rest.slice(0, lastUnderscore);
  const choice = rest.slice(lastUnderscore + 1);

  const duel = duels.get(giveawayId);

  if (!duel) {
    return interaction.reply({
      content: "❌ This duel is no longer active.",
      ephemeral: true
    });
  }

  if (interaction.user.id !== duel.p1 && interaction.user.id !== duel.p2) {
    return interaction.reply({
      content: "❌ You're not part of this duel.",
      ephemeral: true
    });
  }

  if (!CHOICES.includes(choice)) {
    return interaction.reply({
      content: "❌ Invalid choice.",
      ephemeral: true
    });
  }

  duel.choices[interaction.user.id] = choice;

  await interaction.reply({
    content: `You chose ${capitalize(choice)}. Waiting on the other player if they haven't picked yet.`,
    ephemeral: true
  });

  const bothChosen = duel.choices[duel.p1] && duel.choices[duel.p2];

  if (!bothChosen) {
    await updateDuelMessage(interaction.client, duel);
    return;
  }

  const result = resolveRound(duel.choices[duel.p1], duel.choices[duel.p2]);

  if (result === "tie") {
    duel.choices = {};
    await updateDuelMessage(interaction.client, duel, { tie: true });
    // New round — give them another 5 minutes.
    armTimeout(interaction.client, duel);
    return;
  }

  const winnerId = result === "p1" ? duel.p1 : duel.p2;
  await finishDuel(interaction.client, duel, winnerId);
}

module.exports = {
  startDuel,
  handleChoice
};
