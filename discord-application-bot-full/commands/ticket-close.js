const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const config = require("../config");
const { closeTicket } = require("../ticketManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-close")
    .setDescription("Close the current ticket.")
    .setDefaultMemberPermissions(null)
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Why this ticket is being closed (optional).")
        .setRequired(false)
        .setMaxLength(500)
    ),

  async execute(interaction) {
    const channel = interaction.channel;

    const isTicket =
      channel &&
      ((channel.topic && channel.topic.startsWith("ticket:")) ||
        channel.name?.startsWith("giveaway-claim-"));

    if (!isTicket) {
      return interaction.reply({
        content: "❌ This command can only be used inside a ticket.",
        ephemeral: true
      });
    }

    // The ticket's topic looks like "ticket:<type>:<userId>" — pull the
    // type out so we can also allow the role assigned to that specific
    // ticket category (e.g. the bug-report role for a bug ticket).
    // Older giveaway claim tickets (created before topics were added to
    // them) fall back to the "giveaway" ticket type by channel name.
    const ticketType = channel.topic
      ? channel.topic.split(":")[1]
      : "giveaway";
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
        content: "❌ You need the staff role to close this ticket.",
        ephemeral: true
      });
    }

    const reason = interaction.options.getString("reason");

    await closeTicket(interaction, reason);
  }
};
