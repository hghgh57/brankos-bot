const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-add")
    .setDescription("Add a user to the current ticket.")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to add to this ticket.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(null),

  async execute(interaction) {
    const channel = interaction.channel;

    if (!channel || !channel.topic || !channel.topic.startsWith("ticket:")) {
      return interaction.reply({
        content: "❌ This command can only be used inside a ticket.",
        ephemeral: true
      });
    }

    // The ticket's topic looks like "ticket:<type>:<userId>" — pull the
    // type out so the role assigned to that specific ticket category
    // (e.g. the bug-report role for a bug ticket) can also add people,
    // same as /ticket-close does.
    const ticketType = channel.topic.split(":")[1];
    const ticketRoleId = config.tickets[ticketType]?.roleId;

    const hasPermission = interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    );
    const hasStaffRole = interaction.member.roles.cache.has(
      config.staffRoleId
    );
    const hasTicketRole =
      ticketRoleId && interaction.member.roles.cache.has(ticketRoleId);

    if (!hasPermission && !hasStaffRole && !hasTicketRole) {
      return interaction.reply({
        content: "❌ You need the staff role to add someone to this ticket.",
        ephemeral: true
      });
    }

    const user = interaction.options.getUser("user");

    const alreadyHasAccess = channel
      .permissionsFor(user.id)
      ?.has(PermissionFlagsBits.ViewChannel);

    if (alreadyHasAccess) {
      return interaction.reply({
        content: `❌ ${user} already has access to this ticket.`,
        ephemeral: true
      });
    }

    try {
      await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true
      });
    } catch (error) {
      console.error("❌ Failed to add user to ticket:", error);

      return interaction.reply({
        content:
          "❌ Something went wrong while adding them. Make sure I have Manage Channels permission.",
        ephemeral: true
      });
    }

    await interaction.reply({
      content: `✅ ${user} has been added to the ticket by ${interaction.user}.`
    });
  }
};
