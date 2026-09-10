const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const config = require("./config");

const giveaways = new Map();

// Role that gets pinged (and given access) whenever someone claims a giveaway win.
const CLAIM_PING_ROLE_ID = "1484216939466461376";

// setTimeout only accepts a 32-bit signed int (~24.8 days) before it overflows
// and fires immediately. Since giveaways can run up to 30 days, we chain
// timeouts so long giveaways actually wait the full duration instead of
// ending early / looking "stuck".
const MAX_TIMEOUT_MS = 2147483647;

function scheduleTimeout(callback, delay) {
  if (delay > MAX_TIMEOUT_MS) {
    return setTimeout(
      () => scheduleTimeout(callback, delay - MAX_TIMEOUT_MS),
      MAX_TIMEOUT_MS
    );
  }
  return setTimeout(callback, delay);
}

function parseDuration(input) {
  const match = input
    .toLowerCase()
    .trim()
    .match(/^(\d+)\s*(s|m|h|d|w)$/);

  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };

  return amount * multipliers[unit];
}

// Discord's <t:...:R> tag only updates in coarse steps (minutes at a time
// past the first minute), so on short giveaways it can look frozen. This
// builds a literal "Xm Ys" string from the actual remaining time, so it
// genuinely counts down each time we refresh the embed.
function formatTimeLeft(ms) {
  if (ms <= 0) return "0s";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || parts.length === 0) parts.push(`${seconds}s`);

  return parts.slice(0, 2).join(" ");
}

function createGiveawayEmbed(giveaway) {
  const hasWinners = giveaway.winners.length > 0;
  const endTimestamp = Math.floor(giveaway.endTime / 1000);
  const timeLeft = formatTimeLeft(giveaway.endTime - Date.now());

  const lines = [
    hasWinners
      ? ""
      : "Click the button below to enter!",
    "",
    hasWinners
      ? `**Winner(s):** ${giveaway.winners.map(id => `<@${id}>`).join(" ")}`
      : `**Winners:** ${giveaway.winnerCount}`,
    `**Hosted by:** ${giveaway.host}`,
    // Once the giveaway has ended, drop the "Ends:" line entirely
    // (the countdown box just goes away, like a timer that's done)
    // instead of leaving a relative timestamp behind.
    ...(hasWinners
      ? []
      : [`**Ends:** \`${timeLeft}\``]),
    "",
    `<t:${endTimestamp}:F>`
  ];

  return new EmbedBuilder()
    .setColor(0x0000ff)
    .setTitle(`${giveaway.prize}`)
    .setDescription(lines.join("\n"));
}

function createJoinButton(giveaway, disabled = false) {
  const button = new ButtonBuilder()
    .setCustomId(`giveaway_join_${giveaway.id}`)
    .setLabel(` 🎉 Join Giveaway (${giveaway.entries.size})`)
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled);

  return new ActionRowBuilder().addComponents(button);
}

function createLeaveButton(giveaway) {
  const button = new ButtonBuilder()
    .setCustomId(`giveaway_leave_${giveaway.id}`)
    .setLabel("Leave Giveaway")
    .setStyle(ButtonStyle.Danger);

  return new ActionRowBuilder().addComponents(button);
}

// Discord's <t:...:R> tag DOES tick down on its own client-side, but if the
// message never gets edited some clients cache/stop refreshing it and it
// visually "sticks". We force a re-render every 9s so it never freezes,
// on top of the live client-side ticking.
function startCountdownRefresh(client, giveawayId) {
  const giveaway = giveaways.get(giveawayId);
  if (!giveaway) return;

  giveaway.refreshInterval = setInterval(async () => {
    const g = giveaways.get(giveawayId);

    if (!g || g.winners.length > 0 || Date.now() >= g.endTime) {
      clearInterval(g?.refreshInterval);
      return;
    }

    try {
      const channel = client.channels.cache.get(g.channelId);
      if (!channel) return;

      const message = await channel.messages.fetch(g.messageId);

      await message.edit({
        embeds: [createGiveawayEmbed(g)],
        components: [createJoinButton(g)]
      });
    } catch (error) {
      console.error("Giveaway countdown refresh error:", error);
    }
  }, 9 * 1000);
}

async function startGiveaway({
  interaction,
  prize,
  winners,
  duration,
  isRps = false
}) {
  const durationMs = parseDuration(duration);

  if (!durationMs) {
    return {
      success: false,
      error:
        "Invalid duration. Use `10m`, `1h`, `7d` or `1w`."
    };
  }

  if (durationMs < 10000) {
    return {
      success: false,
      error:
        "The giveaway must last at least 10 seconds."
    };
  }

  if (
    durationMs >
    30 * 24 * 60 * 60 * 1000
  ) {
    return {
      success: false,
      error:
        "The giveaway cannot last longer than 30 days."
    };
  }

  const giveawayId =
    `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

  // RPS giveaways are always a 2-person duel — the host never picks the
  // winner count for these, no matter what gets passed in.
  const winnerCount = isRps ? 2 : winners;

  // baseName keeps the plain prize text around (e.g. for the RPS duel
  // embed / win message), separate from the "RPS — " prefixed version
  // shown on the giveaway listing itself.
  const displayPrize = isRps ? `RPS — ${prize}` : prize;

  const giveaway = {
    id: giveawayId,

    guildId: interaction.guild.id,
    channelId: interaction.channel.id,
    messageId: null,

    prize: displayPrize,
    baseName: prize,
    winnerCount,
    isRps,

    hostId: interaction.user.id,
    host: `<@${interaction.user.id}>`,

    endTime: Date.now() + durationMs,

    entries: new Set(),
    winners: [],
    claimed: new Set(),

    winnerMessageId: null,
    refreshInterval: null
  };

  const giveawayMessage =
    await interaction.channel.send({
      embeds: [
        createGiveawayEmbed(giveaway)
      ],
      components: [
        createJoinButton(giveaway)
      ]
    });

  giveaway.messageId =
    giveawayMessage.id;

  giveaways.set(
    giveawayId,
    giveaway
  );

  scheduleTimeout(() => {
    endGiveaway(
      interaction.client,
      giveawayId
    ).catch(console.error);
  }, durationMs);

  startCountdownRefresh(interaction.client, giveawayId);

  // DM the host their giveaway ID (needed for /greroll later).
  try {
    await interaction.user.send({
      content:
        `🎉 Your giveaway for **${displayPrize}** has started in **${interaction.guild.name}**!\n` +
        `**Giveaway ID:** \`${giveawayId}\`\n` +
        `Keep this ID — you'll need it to run \`/greroll giveawayid:${giveawayId}\` if you ever need to reroll a winner.`
    });
  } catch (error) {
    console.error(
      "Could not DM giveaway host (DMs may be closed):",
      error
    );
  }

  return {
    success: true,
    giveawayId
  };
}

async function joinGiveaway(
  interaction,
  giveawayId
) {
  const giveaway =
    giveaways.get(giveawayId);

  if (!giveaway) {
    return interaction.reply({
      content:
        "❌ This giveaway no longer exists.",
      ephemeral: true
    });
  }

  if (
    Date.now() >=
    giveaway.endTime
  ) {
    return interaction.reply({
      content:
        "❌ This giveaway has already ended.",
      ephemeral: true
    });
  }

  if (
    giveaway.entries.has(
      interaction.user.id
    )
  ) {
    return interaction.reply({
      content:
        "You already joined the giveaway",
      components: [
        createLeaveButton(giveaway)
      ],
      ephemeral: true
    });
  }

  giveaway.entries.add(
    interaction.user.id
  );

  try {
    const channel =
      interaction.client.channels.cache.get(
        giveaway.channelId
      );

    if (channel) {
      const message =
        await channel.messages.fetch(
          giveaway.messageId
        );

      await message.edit({
        embeds: [
          createGiveawayEmbed(
            giveaway
          )
        ],
        components: [
          createJoinButton(giveaway)
        ]
      });
    }
  } catch (error) {
    console.error(
      "Giveaway update error:",
      error
    );
  }

  await interaction.reply({
    content:
      "You joined the giveaway",
    components: [
      createLeaveButton(giveaway)
    ],
    ephemeral: true
  });
}

async function leaveGiveaway(
  interaction,
  giveawayId
) {
  const giveaway =
    giveaways.get(giveawayId);

  if (!giveaway) {
    await interaction.reply({
      content:
        "❌ This giveaway no longer exists.",
      ephemeral: true
    });
    return { success: false };
  }

  if (
    Date.now() >=
    giveaway.endTime
  ) {
    await interaction.reply({
      content:
        "❌ This giveaway has already ended.",
      ephemeral: true
    });
    return { success: false };
  }

  if (
    !giveaway.entries.has(
      interaction.user.id
    )
  ) {
    await interaction.reply({
      content:
        "❌ You are not entered in this giveaway.",
      ephemeral: true
    });
    return { success: false };
  }

  giveaway.entries.delete(
    interaction.user.id
  );

  try {
    const channel =
      interaction.client.channels.cache.get(
        giveaway.channelId
      );

    if (channel) {
      const message =
        await channel.messages.fetch(
          giveaway.messageId
        );

      await message.edit({
        embeds: [
          createGiveawayEmbed(
            giveaway
          )
        ],
        components: [
          createJoinButton(giveaway)
        ]
      });
    }
  } catch (error) {
    console.error(
      "Giveaway update error:",
      error
    );
  }

  await interaction.reply({
    content:
      "You left the giveaway",
    components: [
      createJoinButton(giveaway)
    ],
    ephemeral: true
  });

  return { success: true };
}

async function endGiveaway(
  client,
  giveawayId
) {
  const giveaway =
    giveaways.get(giveawayId);

  if (!giveaway) return;

  if (
    giveaway.winners.length > 0
  ) {
    return;
  }

  if (giveaway.refreshInterval) {
    clearInterval(giveaway.refreshInterval);
    giveaway.refreshInterval = null;
  }

  const entries = [
    ...giveaway.entries
  ];

  const winners = [];

  while (
    winners.length <
      giveaway.winnerCount &&
    entries.length > 0
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
          entries.length
      );

    winners.push(
      entries.splice(
        randomIndex,
        1
      )[0]
    );
  }

  giveaway.winners = winners;

  const channel =
    client.channels.cache.get(
      giveaway.channelId
    );

  if (!channel) return;

  // RPS giveaways with exactly 2 winners don't get the normal winner
  // announcement — instead the giveaway message turns into a Rock
  // Paper Scissors duel between the two of them, and whoever wins
  // THAT gets the usual win message + Claim button (see
  // finalizeGiveawayWinner below, called by rpsManager once the duel
  // ends). If there weren't enough entries for a real duel (0 or 1
  // entrants), fall through to the normal flow below instead.
  if (giveaway.isRps && winners.length === 2) {
    try {
      // Required lazily to avoid a load-order dependency between the
      // two files — rpssManager requires giveawayManager at the top of
      // its file, so this file can't safely require rpssManager at the
      // top of its own file too.
      const rpssManager = require("./rpssManager");
      await rpssManager.startDuel(client, giveaway);
    } catch (error) {
      console.error("Could not start RPS duel:", error);
    }
    return;
  }

  // Not enough entrants to run an RPS duel (0 or 1 people joined).
  // Don't fall through to the normal "declare a winner" flow below —
  // an RPS giveaway needs exactly 2 people to duel.
  if (giveaway.isRps && winners.length < 2) {
    const notEnoughText =
      winners.length === 0
        ? `🎉 **${giveaway.prize}**\n\n❌ **No one entered this giveaway.**`
        : `🎉 **${giveaway.prize}**\n\n❌ **Not enough entrants for an RPS duel — need at least 2 joins.**`;

    // The random pick above may have "selected" the lone entrant (or
    // nobody) as a winner before we knew there weren't enough people
    // for a real duel. Nobody actually won, so clear it back out —
    // otherwise createGiveawayEmbed() below sees winners.length > 0
    // and shows them as "Winner(s)" right under the "no one won" text.
    giveaway.winners = [];

    await channel.send({ content: notEnoughText });

    try {
      const originalMessage = await channel.messages.fetch(giveaway.messageId);

      await originalMessage.edit({
        embeds: [createGiveawayEmbed(giveaway)],
        components: [createJoinButton(giveaway, true)]
      });
    } catch (error) {
      console.error(
        "Could not update the giveaway message after it ended:",
        error
      );
    }

    return;
  }

  let winnerText;

  if (winners.length === 0) {
    winnerText =
      `🎉 **${giveaway.prize}**\n\n` +
      "❌ **No one entered this giveaway.**";
  } else {
    const winnerMentions =
      winners
        .map(id => `<@${id}>`)
        .join(" ");

    winnerText =
      `🎉 ${winnerMentions} **you won ${giveaway.prize}!**`;
  }

  const claimButton =
    new ButtonBuilder()
      .setCustomId(
        `giveaway_claim_${giveaway.id}`
      )
      .setLabel(
        "Claim Prize"
      )
      .setEmoji("🎁")
      .setStyle(
        ButtonStyle.Success
      );

  const row =
    new ActionRowBuilder()
      .addComponents(
        claimButton
      );

  const winnerMessage = await channel.send({
    content: winnerText,
    components: [row]
  });

  giveaway.winnerMessageId = winnerMessage.id;

  // Keep the original giveaway message up (with the final embed and a
  // disabled join button) instead of stripping its components away.
  try {
    const originalMessage =
      await channel.messages.fetch(
        giveaway.messageId
      );

    await originalMessage.edit({
      embeds: [
        createGiveawayEmbed(giveaway)
      ],
      components: [
        createJoinButton(giveaway, true)
      ]
    });
  } catch (error) {
    console.error(
      "Could not update the giveaway message after it ended:",
      error
    );
  }
}

async function rerollGiveaway(
  interaction,
  giveawayId
) {
  const giveaway =
    giveaways.get(giveawayId);

  if (!giveaway) {
    return interaction.reply({
      content:
        "❌ This giveaway no longer exists.",
      ephemeral: true
    });
  }

  if (giveaway.winners.length === 0) {
    return interaction.reply({
      content:
        "❌ This giveaway hasn't ended yet, so there's nothing to reroll.",
      ephemeral: true
    });
  }

  const entries = [
    ...giveaway.entries
  ];

  if (entries.length === 0) {
    return interaction.reply({
      content:
        "❌ There are no entries to pick a new winner from.",
      ephemeral: true
    });
  }

  const winnerCount = Math.min(
    giveaway.winnerCount,
    entries.length
  );

  const newWinners = [];

  while (
    newWinners.length < winnerCount &&
    entries.length > 0
  ) {
    const randomIndex =
      Math.floor(
        Math.random() * entries.length
      );

    newWinners.push(
      entries.splice(randomIndex, 1)[0]
    );
  }

  giveaway.winners = newWinners;
  giveaway.claimed = new Set();

  const winnerMentions =
    newWinners
      .map(id => `<@${id}>`)
      .join(" ");

  const channel =
    interaction.client.channels.cache.get(
      giveaway.channelId
    );

  if (channel) {
    const claimButton =
      new ButtonBuilder()
        .setCustomId(
          `giveaway_claim_${giveaway.id}`
        )
        .setLabel("Claim Now")
        .setEmoji("🎁")
        .setStyle(ButtonStyle.Success);

    const row =
      new ActionRowBuilder().addComponents(
        claimButton
      );

    const winnerMessage = await channel.send({
      content:
        `🎉 New winner(s) for **${giveaway.prize}**: ${winnerMentions}!`,
      components: [row]
    });

    giveaway.winnerMessageId = winnerMessage.id;

    try {
      const originalMessage =
        await channel.messages.fetch(
          giveaway.messageId
        );

      await originalMessage.edit({
        embeds: [
          createGiveawayEmbed(giveaway)
        ],
        components: [
          createJoinButton(giveaway, true)
        ]
      });
    } catch (error) {
      console.error(
        "Could not update the giveaway message after reroll:",
        error
      );
    }
  }

  return interaction.reply({
    content: `✅ Rerolled! New winner(s): ${winnerMentions}`,
    ephemeral: true
  });
}

async function claimGiveaway(
  interaction,
  giveawayId
) {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true });
  }

  const giveaway =
    giveaways.get(giveawayId);

  if (!giveaway) {
    return interaction.editReply({
      content:
        "❌ This giveaway no longer exists.",
      ephemeral: true
    });
  }

  if (
    !giveaway.winners.includes(
      interaction.user.id
    )
  ) {
    return interaction.editReply({
      content:
        "❌ You are not one of the winners of this giveaway.",
      ephemeral: true
    });
  }

  if (
    giveaway.claimed.has(
      interaction.user.id
    )
  ) {
    return interaction.editReply({
      content:
        "❌ You have already claimed this giveaway.",
      ephemeral: true
    });
  }

  const guild =
    interaction.guild;

  if (!guild) {
    return interaction.editReply({
      content:
        "❌ This can only be claimed inside the server.",
      ephemeral: true
    });
  }

  const channelName =
    `giveaway-claim-${interaction.user.username}`
      .toLowerCase()
      .replace(
        /[^a-z0-9-]/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .slice(0, 90);

  const supportRoleId =
    config.tickets?.support?.roleId;

  const permissions = [
    {
      id: guild.roles.everyone.id,
      deny: [
        PermissionsBitField.Flags.ViewChannel
      ]
    },

    {
      id: interaction.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory
      ]
    },

    {
      id: giveaway.hostId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory
      ]
    }
  ];

  if (supportRoleId) {
    permissions.push({
      id: supportRoleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageMessages
      ]
    });
  }

  if (CLAIM_PING_ROLE_ID) {
    permissions.push({
      id: CLAIM_PING_ROLE_ID,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageMessages
      ]
    });
  }

  let ticketChannel;

  try {
    ticketChannel =
      await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: "1546682658359087167",
        permissionOverwrites:
          permissions
      });
  } catch (error) {
    console.error(
      "Giveaway ticket error:",
      error
    );

    return interaction.editReply({
      content:
        "❌ I could not create the ticket. Please check my permissions.",
      ephemeral: true
    });
  }

  giveaway.claimed.add(
    interaction.user.id
  );

  await interaction.editReply({
    content:
      `✅ **Ticket created!**\nYour giveaway claim ticket has been created: ${ticketChannel}`,
    ephemeral: true
  });

  const winnerMention =
    `<@${interaction.user.id}>`;

  const hostMention =
    `<@${giveaway.hostId}>`;

  const embed =
    new EmbedBuilder()
      .setColor(0x0000ff)
      .setTitle(
        `Giveaway Claim — ${interaction.user.username}`
      )
      .setDescription(
        `Hey ${winnerMention}, thanks for claiming the giveaway!\n\n` +
        "Our support team will be with you shortly."
      )
      .addFields(
        {
          name: "Prize",
          value: giveaway.prize,
          inline: false
        },
        {
          name: "Host",
          value: hostMention,
          inline: true
        },
        {
          name: "Winner",
          value: winnerMention,
          inline: true
        }
      )
      .setFooter({
        text:
          "Brankos community support"
      });

  const closeButton =
    new ButtonBuilder()
      .setCustomId(
        "ticket_close"
      )
      .setLabel(
        "Close Ticket"
      )
      .setStyle(
        ButtonStyle.Danger
      );

  const rowComponents = [closeButton];

  // Let the winner/host jump straight back to the winner announcement message.
  if (giveaway.winnerMessageId) {
    const jumpButton = new ButtonBuilder()
      .setLabel("Jump to Win")
      .setStyle(ButtonStyle.Link)
      .setURL(
        `https://discord.com/channels/${guild.id}/${giveaway.channelId}/${giveaway.winnerMessageId}`
      );

    rowComponents.push(jumpButton);
  }

  const row =
    new ActionRowBuilder()
      .addComponents(
        rowComponents
      );

  await ticketChannel.send({
    content:
      `<@&${CLAIM_PING_ROLE_ID}> ${winnerMention}`,
    embeds: [embed],
    components: [row]
  });
}

// Called by rpsManager once the RPS duel has a winner. Sends the same
// win message + Claim button that a normal giveaway sends, just for
// the single duel winner instead of the full winner list.
async function finalizeGiveawayWinner(client, giveawayId, winnerId) {
  const giveaway = giveaways.get(giveawayId);
  if (!giveaway) return;

  giveaway.winners = [winnerId];

  const channel = client.channels.cache.get(giveaway.channelId);
  if (!channel) return;

  const winnerMention = `<@${winnerId}>`;

  const winnerText =
    `🎉 ${winnerMention} **you won ${giveaway.baseName || giveaway.prize}!**`;

  const claimButton =
    new ButtonBuilder()
      .setCustomId(`giveaway_claim_${giveaway.id}`)
      .setLabel("Claim Prize")
      .setEmoji("🎁")
      .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(claimButton);

  const winnerMessage = await channel.send({
    content: winnerText,
    components: [row]
  });

  giveaway.winnerMessageId = winnerMessage.id;
}

function initGiveaways(client) {
  // Giveaway state is kept in-memory only (no DB/file persistence),
  // so there is nothing to restore on restart. This just confirms
  // the manager is ready once the client is logged in.
  console.log(
    `✅ Giveaway manager initialized (${giveaways.size} active giveaways).`
  );
}

module.exports = {
  initGiveaways,
  startGiveaway,
  joinGiveaway,
  leaveGiveaway,
  claimGiveaway,
  rerollGiveaway,
  finalizeGiveawayWinner
};
