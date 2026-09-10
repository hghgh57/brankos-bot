const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const config = require("./config");

const BLUE = 0x0000FF;

async function createTicket(interaction, type) {
  try {
    const ticketConfig = config.tickets[type];

    if (!ticketConfig) {
      return interaction.reply({
        content: "❌ This ticket type does not exist.",
        ephemeral: true
      });
    }

    const guild = interaction.guild;
    const user = interaction.user;

    // Check if the user already has a ticket of this type
    const existingTicket = guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildText &&
        channel.topic === `ticket:${type}:${user.id}`
    );

    if (existingTicket) {
      return interaction.reply({
        content: `❌ You already have a ticket open: ${existingTicket}`,
        ephemeral: true
      });
    }

    const channel = await guild.channels.create({
      name: `${ticketConfig.name}-${user.username}`,
      type: ChannelType.GuildText,
      parent: ticketConfig.categoryId,

      topic: `ticket:${type}:${user.id}`,

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
          id: ticketConfig.roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks
          ]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setColor(
        ticketConfig.color || BLUE
      )
      .setTitle(
        `${ticketConfig.label} — ${user.username}`
      )
      .setDescription(
        `Hey ${user}, thanks for opening a ticket! Our support team will be with you shortly.\n\nPlease provide a brief description of your issue.`
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `<@&${ticketConfig.roleId}> ${user}`,
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: `✅ Your ticket has been created: ${channel}`,
      ephemeral: true
    });

  } catch (error) {
    console.error(
      "❌ Ticket creation error:",
      error
    );

    // Surface the actual Discord API reason instead of a generic message,
    // so it's obvious what to fix (bad category ID, missing perms, etc.)
    const code = error.code ? ` (code ${error.code})` : "";
    const detail = error.message || "Unknown error";

    if (
      !interaction.replied &&
      !interaction.deferred
    ) {
      await interaction.reply({
        content: `❌ Something went wrong while creating the ticket${code}: ${detail}`,
        ephemeral: true
      }).catch(() => {});
    }
  }
}

async function closeTicket(interaction) {
  try {
    const channel = interaction.channel;

    if (!channel) {
      return interaction.reply({
        content: "❌ This channel cannot be closed.",
        ephemeral: true
      });
    }

    await interaction.reply({
      content: "🔒 Closing ticket...",
      ephemeral: true
    });

    // Create transcript
    const messages = await channel.messages.fetch({
      limit: 100
    });

    const sortedMessages = [...messages.values()]
      .sort(
        (a, b) =>
          a.createdTimestamp -
          b.createdTimestamp
      );

    let transcript = "";

    for (const message of sortedMessages) {
      const timestamp =
        new Date(
          message.createdTimestamp
        ).toISOString();

      transcript +=
        `[${timestamp}] ${message.author.tag}: ${message.content}\n`;

      if (message.attachments.size > 0) {
        for (const attachment of message.attachments.values()) {
          transcript +=
            `Attachment: ${attachment.url}\n`;
        }
      }
    }

    const transcriptChannel =
      config.transcriptChannelId
        ? await interaction.guild.channels
            .fetch(config.transcriptChannelId)
            .catch(() => null)
        : null;

    if (
      transcriptChannel &&
      transcriptChannel.isTextBased()
    ) {
      const transcriptEmbed =
        new EmbedBuilder()
          .setColor(BLUE)
          .setTitle(
            `Ticket Closed — ${channel.name}`
          )
          .setDescription(
            `Ticket closed by ${interaction.user}.`
          )
          .setTimestamp();

      await transcriptChannel.send({
        embeds: [transcriptEmbed],
        files: [
          {
            attachment: Buffer.from(
              transcript || "No messages found.",
              "utf8"
            ),
            name: `${channel.name}.txt`
          }
        ]
      });
    }

    await channel.delete();

  } catch (error) {
    console.error(
      "❌ Ticket close error:",
      error
    );
  }
}

module.exports = {
  createTicket,
  closeTicket
};
