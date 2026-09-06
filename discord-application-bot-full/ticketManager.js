const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} = require("discord.js");

const config = require("./config");

const BLUE = 0x0000FF;

const activeTickets = new Map();

async function createTicket(interaction, type) {
  const ticketConfig = config.tickets[type];

  if (!ticketConfig) {
    return interaction.reply({
      content: "❌ That ticket type does not exist.",
      ephemeral: true
    });
  }

  const guild = interaction.guild;
  const user = interaction.user;

  const existingTicket = guild.channels.cache.find(
    channel =>
      channel.type === ChannelType.GuildText &&
      channel.topic === `ticket-owner:${user.id}`
  );

  if (existingTicket) {
    return interaction.reply({
      content: `❌ You already have a ticket: ${existingTicket}`,
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const roleId = ticketConfig.roleId;

    const channelName =
      `${ticketConfig.name}-${user.username}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .substring(0, 90);

    const permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]
      },
      {
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]
      },
      {
        id: interaction.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]
      }
    ];

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: ticketConfig.categoryId,
      topic: `ticket-owner:${user.id}`,
      permissionOverwrites
    });

    activeTickets.set(channel.id, {
      ownerId: user.id,
      openedAt: new Date(),
      type
    });

    const ticketEmbed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle(`${ticketConfig.label} — ${user.username}`)
      .setDescription(
        `Hey ${user}, thanks for opening a ticket! Our support team will be with you shortly. Please provide a brief description of your issue.`
      )
      .setFooter({
        text: "Brankos community support"
      })
      .setTimestamp();

    const closeButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `<@&${roleId}> ${user}`,
      embeds: [ticketEmbed],
      components: [closeButton]
    });

    await interaction.editReply({
      content: `✅ Your ticket has been created: ${channel}`
    });
  } catch (error) {
    console.error("Ticket creation error:", error);

    await interaction.editReply({
      content:
        "❌ I could not create the ticket. Make sure I have Manage Channels permission and that the category/role IDs are correct."
    });
  }
}

async function closeTicket(interaction) {
  const channel = interaction.channel;

  if (!channel || channel.type !== ChannelType.GuildText) {
    return interaction.reply({
      content: "❌ This is not a ticket channel.",
      ephemeral: true
    });
  }

  if (!channel.topic || !channel.topic.startsWith("ticket-owner:")) {
    return interaction.reply({
      content: "❌ This is not a ticket channel.",
      ephemeral: true
    });
  }

  const ownerId = channel.topic.replace("ticket-owner:", "");
  const ticketData = activeTickets.get(channel.id);

  let ticketConfig = null;

  if (ticketData && config.tickets[ticketData.type]) {
    ticketConfig = config.tickets[ticketData.type];
  }

  if (
    !interaction.member.permissions.has(
      PermissionFlagsBits.ManageChannels
    ) &&
    interaction.user.id !== ownerId
  ) {
    return interaction.reply({
      content: "❌ You do not have permission to close this ticket.",
      ephemeral: true
    });
  }

  await interaction.deferReply();

  try {
    let openedAt = ticketData?.openedAt;

    if (!openedAt) {
      openedAt = channel.createdAt || new Date();
    }

    const closedAt = new Date();

    const messages = [];
    let lastId;

    while (true) {
      const fetched = await channel.messages.fetch({
        limit: 100,
        ...(lastId ? { before: lastId } : {})
      });

      if (fetched.size === 0) break;

      messages.push(...fetched.values());

      lastId = fetched.last().id;

      if (fetched.size < 100) break;
    }

    messages.reverse();

    let transcript = "";

    transcript += "========================================\n";
    transcript += "              TICKET TRANSCRIPT\n";
    transcript += "========================================\n\n";

    transcript += `Ticket: #${channel.name}\n`;
    transcript += `Type: ${ticketConfig?.label || "Unknown"}\n`;
    transcript += `Opened By: ${ownerId}\n`;
    transcript += `Closed By: ${interaction.user.tag} (${interaction.user.id})\n`;
    transcript += `Opened At: ${openedAt.toISOString()}\n`;
    transcript += `Closed At: ${closedAt.toISOString()}\n\n`;

    transcript += "========================================\n";
    transcript += "                 MESSAGES\n";
    transcript += "========================================\n\n";

    for (const message of messages) {
      transcript += `[${message.createdAt.toISOString()}] ${message.author.tag} (${message.author.id})\n`;
      transcript += `${message.content || "[Embed/Attachment/No text]"}\n`;

      if (message.attachments.size > 0) {
        for (const attachment of message.attachments.values()) {
          transcript += `Attachment: ${attachment.url}\n`;
        }
      }

      transcript += "\n";
    }

    const transcriptBuffer = Buffer.from(transcript, "utf8");

    const transcriptFile = new AttachmentBuilder(
      transcriptBuffer,
      {
        name: `${channel.name}-transcript.txt`
      }
    );

    const transcriptChannel = await interaction.client.channels
      .fetch(config.transcriptChannelId)
      .catch(() => null);

    if (!transcriptChannel || !transcriptChannel.isTextBased()) {
      await interaction.editReply({
        content:
          "❌ I couldn't find the transcript channel. Please set transcriptChannelId in config.js."
      });

      return;
    }

    const transcriptEmbed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle("📄 Ticket Transcript")
      .setDescription(
        "A ticket has been closed and its transcript has been saved."
      )
      .addFields(
        {
          name: "🎫 Ticket",
          value: `#${channel.name}`,
          inline: true
        },
        {
          name: "👤 Opened By",
          value: `<@${ownerId}>`,
          inline: true
        },
        {
          name: "🔒 Closed By",
          value: `${interaction.user}`,
          inline: true
        },
        {
          name: "🕐 Opened At",
          value: `<t:${Math.floor(
            openedAt.getTime() / 1000
          )}:F>`,
          inline: false
        },
        {
          name: "🕐 Closed At",
          value: `<t:${Math.floor(
            closedAt.getTime() / 1000
          )}:F>`,
          inline: false
        }
      )
      .setFooter({
        text: "Brankos community support"
      })
      .setTimestamp();

    await transcriptChannel.send({
      embeds: [transcriptEmbed],
      files: [transcriptFile]
    });

    await interaction.editReply({
      content: "✅ Ticket closed and transcript saved."
    });

    activeTickets.delete(channel.id);

    setTimeout(async () => {
      await channel.delete("Ticket closed").catch(console.error);
    }, 3000);
  } catch (error) {
    console.error("Ticket closing error:", error);

    if (interaction.deferred) {
      await interaction.editReply({
        content: "❌ Something went wrong while closing the ticket."
      }).catch(() => {});
    }
  }
}

module.exports = {
  createTicket,
  closeTicket
};
