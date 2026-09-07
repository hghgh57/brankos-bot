const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');

const {
  createTicket,
  claimTicket,
  closeTicket,
  finalizeCloseTicket,
  cancelCloseTicket,
} = require('../ticketManager');

const {
  startApplication,
  handleDecision,
} = require('../applicationManager');

const {
  joinGiveaway,
  claimGiveaway,
} = require('../giveawayManager');

// Maps the button customIds sent by ticket-panel.js / service-tickets.js /
// buy-ad.js to the matching key in config.tickets.
const TICKET_BUTTON_MAP = {
  ticket_support: 'support',
  ticket_bug: 'bug',
  ticket_partner: 'partner',
  ticket_spawners: 'spawners',
  ticket_sponsor: 'sponsor',
  service_ticket_open_dig_out: 'dig_out',
  service_ticket_open_request_build: 'request_build',
  service_ticket_open_buy_ad: 'buy_ad',
};

// Maps the button customIds sent by setup.js to the matching key
// in config.applications.
const APPLICATION_BUTTON_MAP = {
  application_staff: 'staff',
  application_partner: 'partner',
  application_builder: 'builder',
};

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    console.log(
      `[INTERACTION] ${interaction.customId || interaction.commandName || interaction.type}`
    );

    try {
      /* =====================================================
         SLASH COMMANDS
      ===================================================== */

      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
          console.error(`Unknown slash command received: /${interaction.commandName}`);
          return;
        }

        await command.execute(interaction);
        return;
      }

      /* =====================================================
         TICKET / SERVICE-TICKET OPEN BUTTONS
      ===================================================== */

      if (interaction.isButton() && TICKET_BUTTON_MAP[interaction.customId]) {
        await createTicket(interaction, TICKET_BUTTON_MAP[interaction.customId]);
        return;
      }

      /* =====================================================
         TICKET CONTROL BUTTONS
      ===================================================== */

      if (interaction.isButton() && interaction.customId === 'ticket_claim') {
        await claimTicket(interaction);
        return;
      }

      if (interaction.isButton() && interaction.customId === 'ticket_close') {
        await closeTicket(interaction);
        return;
      }

      if (interaction.isButton() && interaction.customId === 'ticket_close_reason') {
        const modal = new ModalBuilder()
          .setCustomId('ticket_close_reason_modal')
          .setTitle('Close Ticket With Reason');

        const reasonInput = new TextInputBuilder()
          .setCustomId('close_reason_input')
          .setLabel('Reason for closing')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(500);

        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

        await interaction.showModal(modal);
        return;
      }

      if (
        interaction.isModalSubmit() &&
        interaction.customId === 'ticket_close_reason_modal'
      ) {
        const reason = interaction.fields.getTextInputValue('close_reason_input');
        await closeTicket(interaction, reason);
        return;
      }

      if (interaction.isButton() && interaction.customId === 'ticket_close_confirm') {
        await finalizeCloseTicket(interaction);
        return;
      }

      if (interaction.isButton() && interaction.customId === 'ticket_close_cancel') {
        await cancelCloseTicket(interaction);
        return;
      }

      /* =====================================================
         APPLICATION OPEN BUTTONS
      ===================================================== */

      if (interaction.isButton() && APPLICATION_BUTTON_MAP[interaction.customId]) {
        await startApplication(interaction, APPLICATION_BUTTON_MAP[interaction.customId]);
        return;
      }

      /* =====================================================
         APPLICATION ACCEPT / DENY
      ===================================================== */

      if (
        interaction.isButton() &&
        interaction.customId.startsWith('application_decision:')
      ) {
        await handleDecision(interaction);
        return;
      }

      /* =====================================================
         GIVEAWAY BUTTONS
      ===================================================== */

      if (interaction.isButton() && interaction.customId.startsWith('giveaway_join_')) {
        const giveawayId = interaction.customId.replace('giveaway_join_', '');
        await joinGiveaway(interaction, giveawayId);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('giveaway_claim_')) {
        const giveawayId = interaction.customId.replace('giveaway_claim_', '');
        await claimGiveaway(interaction, giveawayId);
        return;
      }
    } catch (err) {
      console.error('Error handling interaction:', err);

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({
            content: '❌ Something went wrong handling that action.',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: '❌ Something went wrong handling that action.',
            ephemeral: true,
          });
        }
      } catch (_) {}
    }
  },
};
