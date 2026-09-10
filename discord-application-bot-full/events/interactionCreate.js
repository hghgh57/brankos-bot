const {
  createTicket,
  closeTicket,
} = require('../ticketManager');

const {
  startApplication,
  handleApplicationDecision,
} = require('../applicationManager');

const config = require('../config.js');
const rootGiveawayManager = require('../giveawayManager');
const ticTacToeManager = require('../ticTacToeManager');
const rpsManager = require('../rpsManager');


/* =========================================================
   MAIN INTERACTION EVENT
========================================================= */

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {

    console.log(
      `[INTERACTION] ${
        interaction.customId ||
        interaction.commandName ||
        interaction.type
      }`
    );

    try {

      /* =====================================================
         SLASH COMMANDS
      ===================================================== */

      if (interaction.isChatInputCommand()) {

        const command =
          interaction.client.commands.get(
            interaction.commandName
          );

        if (!command) return;

        await command.execute(interaction);

        return;
      }


      /* =====================================================
         BUTTONS
      ===================================================== */

      if (interaction.isButton()) {

        /* =================================================
           TIC-TAC-TOE MOVE
        ================================================= */

        if (
          interaction.customId.startsWith('ttt_')
        ) {

          await ticTacToeManager.handleMove(
            interaction
          );

          return;
        }


        /* =================================================
           RPS DUEL CHOICE
        ================================================= */

        if (
          interaction.customId.startsWith('rps_choice_')
        ) {

          await rpsManager.handleChoice(
            interaction
          );

          return;
        }


        if (
          interaction.customId.startsWith('giveaway_claim_')
        ) {
          const giveawayId =
            interaction.customId.replace(
              'giveaway_claim_',
              ''
            );

          if (!giveawayId) {
            return interaction.reply({
              content: '❌ Invalid giveaway.',
              ephemeral: true,
            });
          }

          await rootGiveawayManager.claimGiveaway(
            interaction,
            giveawayId
          );

          return;
        }


        /* =================================================
           GIVEAWAY JOIN / LEAVE
        ================================================= */

        if (
          interaction.customId.startsWith('giveaway_join_') ||
          interaction.customId.startsWith('giveaway_leave_')
        ) {
          const isLeave =
            interaction.customId.startsWith('giveaway_leave_');

          const prefix =
            isLeave
              ? 'giveaway_leave_'
              : 'giveaway_join_';

          const giveawayId =
            interaction.customId.slice(prefix.length);

          if (!giveawayId) {
            return interaction.reply({
              content: '❌ Invalid giveaway.',
              ephemeral: true,
            });
          }

          if (isLeave) {
            await rootGiveawayManager.leaveGiveaway(
              interaction,
              giveawayId
            );

            return;
          }

          await rootGiveawayManager.joinGiveaway(
            interaction,
            giveawayId
          );

          return;
        }

        /* =================================================
           REACTION ROLES
        ================================================= */

        if (
          interaction.customId.startsWith(
            'rr_'
          )
        ) {

          const roleId =
            interaction.customId.replace(
              'rr_',
              ''
            );

          const member =
            interaction.member;

          await interaction.deferReply({
            ephemeral: true,
          });

          const role =
            await interaction.guild.roles
              .fetch(roleId)
              .catch(() => null);

          if (!role) {

            return interaction.editReply({
              content:
                '❌ That role no longer exists.',
            });
          }

          const configEntry =
            (
              config.reactionRoles?.roles ||
              []
            ).find(
              (r) =>
                r.roleId === roleId
            );

          const displayName =
            configEntry?.label ||
            role.name;


          if (
            member.roles.cache.has(
              roleId
            )
          ) {

            try {

              await member.roles.remove(
                roleId
              );

              await interaction.editReply({
                content:
                  `Removed the **${displayName}** role.`,
              });

            } catch (err) {

              console.error(
                `Failed to remove role ${roleId}:`,
                err
              );

              await interaction.editReply({
                content:
                  `❌ I couldn't remove the **${displayName}** role — check that my bot role is above it.`,
              });
            }

          } else {

            try {

              await member.roles.add(
                roleId
              );

              await interaction.editReply({
                content:
                  `Gave you the **${displayName}** role!`,
              });

            } catch (err) {

              console.error(
                `Failed to add role ${roleId}:`,
                err
              );

              await interaction.editReply({
                content:
                  `❌ I couldn't give you the **${displayName}** role — check that my bot role is above it.`,
              });
            }
          }

          return;
        }


        /* =================================================
           TICKET CLOSE
        ================================================= */

        if (
          interaction.customId ===
          'ticket_close'
        ) {

          await closeTicket(
            interaction
          );

          return;
        }


        /* =================================================
           TICKET PANEL — OPEN TICKET
           (buttons from /ticket-panel, e.g. "ticket_support")
        ================================================= */

        if (
          interaction.customId.startsWith('ticket_')
        ) {

          const type =
            interaction.customId.slice('ticket_'.length);

          if (config.tickets[type]) {
            await createTicket(interaction, type);
            return;
          }
        }


        /* =================================================
           SERVICE TICKET PANEL — OPEN TICKET
           (buttons from /service-tickets, e.g.
           "service_ticket_open_dig_out")
        ================================================= */

        if (
          interaction.customId.startsWith(
            'service_ticket_open_'
          )
        ) {

          const type =
            interaction.customId.slice(
              'service_ticket_open_'.length
            );

          if (config.tickets[type]) {
            await createTicket(interaction, type);
            return;
          }
        }


        /* =================================================
           APPLICATION ACCEPT / DENY
           (buttons on a submitted application in the
           review channel)
        ================================================= */

        if (
          interaction.customId.startsWith('application_accept:') ||
          interaction.customId.startsWith('application_deny:')
        ) {

          await handleApplicationDecision(interaction);
          return;
        }


        /* =================================================
           APPLICATION PANEL — START APPLICATION
           (buttons from /application-setup, e.g.
           "application_staff")
        ================================================= */

        if (
          interaction.customId.startsWith('application_')
        ) {

          const type =
            interaction.customId.slice('application_'.length);

          if (config.applications[type]) {
            await startApplication(interaction, type);
            return;
          }
        }

      }

    } catch (err) {

      console.error(
        'Error handling interaction:',
        err
      );

      try {

        if (
          interaction.deferred ||
          interaction.replied
        ) {

          await interaction.followUp({
            content:
              '❌ Something went wrong handling that action.',
            ephemeral: true,
          });

        } else {

          await interaction.reply({
            content:
              '❌ Something went wrong handling that action.',
            ephemeral: true,
          });
        }

      } catch (_) {}
    }
  },
};
