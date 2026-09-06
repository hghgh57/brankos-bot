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

  // Check if user already has a ticket
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

  await interaction.deferReply({
    ephemeral: true
  });

  try {
    const channel = await guild.channels.create({
      name: `${ticketConfig.name}-${user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      type: ChannelType.GuildText,

      parent: ticketConfig.categoryId,

      topic: `ticket-owner:${user.id}`,

      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [
            PermissionFlagsBits.ViewChannel
          ]
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
      ]
    });

    activeTickets.set(channel.id, {
      ownerId: user.id,
      openedAt: new Date(),
      type
    });

    const ticketEmbed = new EmbedBuilder()
      .setColor(ticketConfig.color)
      .setTitle(`${ticketConfig.emoji} ${ticketConfig.label} Ticket`)
      .setDescription(
        `Welcome ${user}!\n\n` +
        `Thank you for opening a **${ticketConfig.label}** ticket.\n\n` +
        `Please explain what you need help with and a staff member will assist you.\n\n` +
        `🔒 **When you are finished, use the Close button below.**`
      )
      .setFooter({
        text: "Ticket System"
      })
      .setTimestamp();

    const closeButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Close Ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `${user}`,
      embeds: [ticketEmbed],
      components: [closeButton]
    });

    await interaction.editReply({
      content: `✅ Your ticket has been created: ${channel}`
    });

  } catch (error) {
    console.error("Ticket creation error:", error);

    await interaction.editReply({
      content: "❌ I could not create the ticket. Make sure I have Manage Channels permission."
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

  // Only allow staff / people with Manage Channels to close
  if (
    !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) &&
    interaction.user.id !== channel.topic.replace("ticket-owner:", "")
  ) {
    return interaction.reply({
      content: "❌ You do not have permission to close this ticket.",
      ephemeral: true
    });
  }

  await interaction.deferReply();

  try {
    const ownerId = channel.topic.replace("ticket-owner:", "");

    const ticketData = activeTickets.get(channel.id);

    let openedAt = ticketData?.openedAt;

    if (!openedAt) {
      openedAt = new Date();
    }

    // Fetch ALL messages
    let messages = [];
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

    // Create transcript
    let transcript = "";

    transcript += "========================================\n";
    transcript += "              TICKET TRANSCRIPT\n";
    transcript += "========================================\n\n";

    transcript += `Ticket: #${channel.name}\n`;
    transcript += `Opened By: ${ownerId}\n`;
    transcript += `Closed By: ${interaction.user.tag} (${interaction.user.id})\n`;
    transcript += `Opened At: ${openedAt.toISOString()}\n`;
    transcript += `Closed At: ${new Date().toISOString()}\n\n`;

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

    // Find transcript channel
    const transcriptChannel = await interaction.client.channels
      .fetch(config.transcriptChannelId)
      .catch(() => null);

    if (!transcriptChannel || !transcriptChannel.isTextBased()) {
      await interaction.editReply({
        content:
          "❌ I couldn't find the transcript channel. Please set `transcriptChannelId` in config.js."
      });

      return;
    }

    // Blue transcript embed
    const transcriptEmbed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle("📄 Ticket Transcript")
      .setDescription(
        `A ticket has been closed and its transcript has been saved.`
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
          value: `<t:${Math.floor(openedAt.getTime() / 1000)}:F>`,
          inline: false
        },
        {
          name: "🕐 Closed At",
          value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
          inline: false
        }
      )
      .setFooter({
        text: "Ticket System"
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

    // Delete ticket after transcript is safely sent
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
