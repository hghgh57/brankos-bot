const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const config = require("./config");

const giveaways = new Map();

// ================================
// PERSISTENCE
// ================================
// Giveaway timers live in memory (setTimeout), which means a bot
// restart normally wipes them out — the giveaway never actually ends,
// the button never disappears, and no winner ever gets picked.
// To fix that, every change gets written to disk, and on startup we
// reload anything still pending and reschedule (or immediately end,
// if its time already passed while the bot was offline).

const DATA_FILE = path.join(__dirname, "giveaways.json");

function saveGiveaways() {
  const serializable = [...giveaways.values()].map(g => ({
    ...g,
    entries: [...g.entries],
    claimed: [...g.claimed]
  }));

  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(serializable, null, 2)
    );
  } catch (error) {
    console.error("❌ Could not save giveaways.json:", error);
  }
}

function loadGiveawaysFromDisk() {
  if (!fs.existsSync(DATA_FILE)) return [];

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);

    return parsed.map(g => ({
      ...g,
      entries: new Set(g.entries),
      claimed: new Set(g.claimed)
    }));
  } catch (error) {
    console.error("❌ Could not read giveaways.json:", error);
    return [];
  }
}

// Call this once from your ready event: initGiveaways(client)
function initGiveaways(client) {
  const stored = loadGiveawaysFromDisk();

  for (const giveaway of stored) {
    giveaways.set(giveaway.id, giveaway);

    const remaining = giveaway.endTime - Date.now();

    if (giveaway.winners.length > 0) {
      // Already had winners picked before restart — nothing left to do.
      continue;
    }

    if (remaining <= 0) {
      // Time already passed while the bot was offline — end it now.
      endGiveaway(client, giveaway.id).catch(console.error);
    } else {
      setTimeout(() => {
        endGiveaway(client, giveaway.id).catch(console.error);
      }, remaining);
    }

    scheduleRefresh(client, giveaway.id);
  }

  if (stored.length > 0) {
    console.log(
      `🎉 Reloaded ${stored.length} giveaway(s) from disk.`
    );
  }
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

const REFRESH_INTERVAL_MS = 10 * 1000; // how often to nudge Discord to redraw the timestamp
const REFRESH_GRACE_MS = 2 * 60 * 1000; // keep nudging for 2 min after it ends, so "Ended Xm ago" settles visibly

// Periodically re-sends the same embed so Discord's client is forced to
// redraw the <t:...:R> tag. Without this, if nothing else happens in the
// channel, Discord can leave the old rendered text on screen indefinitely
// even though the underlying tag is technically still correct.
function scheduleRefresh(client, giveawayId) {
  const interval = setInterval(async () => {
    const giveaway = giveaways.get(giveawayId);

    if (!giveaway) {
      clearInterval(interval);
      return;
    }

    if (Date.now() > giveaway.endTime + REFRESH_GRACE_MS) {
      clearInterval(interval);
      return;
    }

    try {
      const channel = client.channels.cache.get(giveaway.channelId);
      if (!channel) return;

      const message = await channel.messages
        .fetch(giveaway.messageId)
        .catch(() => null);
      if (!message) return;

      const components =
        giveaway.winners.length > 0
          ? []
          : [createJoinButton(giveaway)];

      await message.edit({
        embeds: [createGiveawayEmbed(giveaway)],
        components
      });
    } catch (error) {
      console.error("Giveaway refresh error:", error);
    }
  }, REFRESH_INTERVAL_MS);
}

// Formats a millisecond duration as "1d 4h", "4m 32s", "10s", etc.
// Keeps at most 2 units so it stays short and readable.
function formatDuration(ms) {
  const abs = Math.abs(ms);

  const seconds = Math.floor(abs / 1000) % 60;
  const minutes = Math.floor(abs / (60 * 1000)) % 60;
  const hours = Math.floor(abs / (60 * 60 * 1000)) % 24;
  const days = Math.floor(abs / (24 * 60 * 60 * 1000));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.slice(0, 2).join(" ");
}

// Builds the "Ends:" line text ourselves instead of relying on Discord's
// <t:...:R> tag. That tag only re-renders when Discord's client happens
// to redraw the message, which isn't reliable — plain text we regenerate
// every refresh tick always shows correctly, since the literal string
// itself changes each time.
function formatEndsText(giveaway) {
  const diff = giveaway.endTime - Date.now();

  if (diff > 0) {
    return `in ${formatDuration(diff)}`;
  }

  return `${formatDuration(diff)} ago`;
}

function createGiveawayEmbed(giveaway) {
  const endTimestamp = Math.floor(giveaway.endTime / 1000);

  // Same embed always — color and title never change, even after the
  // giveaway ends. The "Ends" line is computed fresh every time this
  // function runs (see scheduleRefresh), so it stays accurate as long
  // as the bot keeps re-editing the message periodically.
  return new EmbedBuilder()
    .setColor(0x0000ff)
    .setTitle(` ${giveaway.prize}`)
    .setDescription(
      "Click the button below to enter!\n\n" +
      `**Winners:** ${giveaway.winnerCount}\n` +
      `**Hosted by:** ${giveaway.host}\n` +
      `**Ends:** ${formatEndsText(giveaway)}\n\n` +
      `<t:${endTimestamp}:F>`
    );

  // NOTE: no .setTimestamp() here — that sets Discord's static footer
  // stamp (bottom-right "Today at ..."), which does NOT count down.
}

function createJoinButton(giveaway) {
  const button = new ButtonBuilder()
    .setCustomId(`giveaway_join_${giveaway.id}`)
    .setLabel(`🎉 Join Giveaway (${giveaway.entries.size})`)
    .setStyle(ButtonStyle.Primary);

  return new ActionRowBuilder().addComponents(button);
}

async function startGiveaway({
  interaction,
  prize,
  winners,
  duration
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

  const giveaway = {
    id: giveawayId,

    guildId: interaction.guild.id,
    channelId: interaction.channel.id,
    messageId: null,

    prize,
    winnerCount: winners,

    hostId: interaction.user.id,
    host: `<@${interaction.user.id}>`,

    endTime: Date.now() + durationMs,

    entries: new Set(),
    winners: [],
    claimed: new Set()
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

  saveGiveaways();

  setTimeout(() => {
    endGiveaway(
      interaction.client,
      giveawayId
    ).catch(console.error);
  }, durationMs);

  scheduleRefresh(interaction.client, giveawayId);

  return {
    success: true
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
        "❌ You are already entered in this giveaway.",
      ephemeral: true
    });
  }

  giveaway.entries.add(
    interaction.user.id
  );

  saveGiveaways();

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
      "🎉 You have entered the giveaway!",
    ephemeral: true
  });
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

  saveGiveaways();

  const channel =
    client.channels.cache.get(
      giveaway.channelId
    );

  if (!channel) return;

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
        "🎁 Claim Prize"
      )
      .setStyle(
        ButtonStyle.Success
      );

  const row =
    new ActionRowBuilder()
      .addComponents(
        claimButton
      );

  await channel.send({
    content: winnerText,
    components: [row]
  });

  try {
    const originalMessage =
      await channel.messages.fetch(
        giveaway.messageId
      );

    await originalMessage.edit({
      embeds: [createGiveawayEmbed(giveaway)],
      components: []
    });
  } catch (error) {
    console.error(
      "Could not update ended giveaway embed:",
      error
    );
  }
}

async function claimGiveaway(
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
    !giveaway.winners.includes(
      interaction.user.id
    )
  ) {
    return interaction.reply({
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
    return interaction.reply({
      content:
        "❌ You have already claimed this giveaway.",
      ephemeral: true
    });
  }

  const guild =
    interaction.guild;

  if (!guild) {
    return interaction.reply({
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

  let ticketChannel;

  try {
    ticketChannel =
      await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,

        parent: "1510706103300784240",
        permissionOverwrites:
          permissions
      });
  } catch (error) {
    console.error(
      "Giveaway ticket error:",
      error
    );

    return interaction.reply({
      content:
        "❌ I could not create the ticket. Please check my permissions.",
      ephemeral: true
    });
  }

  giveaway.claimed.add(
    interaction.user.id
  );

  saveGiveaways();

  await interaction.reply({
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

  const row =
    new ActionRowBuilder()
      .addComponents(
        closeButton
      );

  await ticketChannel.send({
    content:
      `${hostMention} ${winnerMention}`,
    embeds: [embed],
    components: [row]
  });
}

module.exports = {
  startGiveaway,
  joinGiveaway,
  claimGiveaway,
  initGiveaways
};
