const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const {
  createTicket,
  claimTicket,
  closeTicket,
  finalizeCloseTicket,
  cancelCloseTicket,
  buildTicketControlRow,
} = require('../ticketManager');

const config = require('../config.js');
const rootGiveawayManager = require('../giveawayManager');



/* =========================================================
   SUPPORT CHECK
========================================================= */

function isSupport(member) {
  const roleIds = config.supportRoleIds || [];

  return roleIds.some(
    (id) =>
      id &&
      !id.startsWith('PUT_') &&
      member.roles.cache.has(id)
  );
}


/* =========================================================
   RESET NORMAL TICKET DROPDOWN
========================================================= */

async function resetTicketDropdown(message) {
  if (!message) return;

  const categories = config.categories || [];

  if (!categories.length) return;

  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket_category_select')
    .setPlaceholder('Select a ticket category…')
    .addOptions(
      categories
        .slice(0, 25)
        .map((cat) => ({
          label: String(cat.label || cat.id).slice(0, 100),

          description: String(
            cat.description || 'Open a ticket'
          ).slice(0, 100),

          value: String(cat.id),

          emoji: cat.emoji || undefined,
        }))
    );

  await message
    .edit({
      components: [
        new ActionRowBuilder().addComponents(menu),
      ],
    })
    .catch((err) => {
      console.error(
        'Failed to reset ticket dropdown:',
        err
      );
    });
}


/* =========================================================
   RESET SERVICE TICKET DROPDOWN
========================================================= */

async function resetServiceTicketDropdown(message) {
  if (!message) return;

  const categories = config.serviceCategories || [];

  if (!categories.length) return;

  const menu = new StringSelectMenuBuilder()
    .setCustomId('service_ticket_category_select')
    .setPlaceholder('Select a service…')
    .addOptions(
      categories
        .slice(0, 25)
        .map((cat) => ({
          label: String(cat.label || cat.id).slice(0, 100),

          description: String(
            cat.description || 'Open a service ticket'
          ).slice(0, 100),

          value: String(cat.id),

          emoji: cat.emoji || undefined,
        }))
    );

  await message
    .edit({
      components: [
        new ActionRowBuilder().addComponents(menu),
      ],
    })
    .catch((err) => {
      console.error(
        'Failed to reset service ticket dropdown:',
        err
      );
    });
}



/* =========================================================
   BUILD TICKET QUESTIONS MODAL
========================================================= */

function buildQuestionsModal(category) {
  const questions = category.questions || [];

  const modal = new ModalBuilder()
    .setCustomId(
      `ticket_questions_modal_${category.id}`
    )
    .setTitle(
      String(
        category.label || 'Ticket'
      ).slice(0, 45)
    );

  questions
    .slice(0, 5)
    .forEach((question, i) => {
      const input = new TextInputBuilder()
        .setCustomId(`q_${i}`)
        .setLabel(
          String(question).slice(0, 45)
        )
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );
    });

  return modal;
}


/* =========================================================
   BUILD CUSTOM TICKET QUESTIONS MODAL
========================================================= */

function buildCustomQuestionsModal(category, roleId) {
  const questions = category.questions || [];

  const modal = new ModalBuilder()
    .setCustomId(
      `custom_ticket_questions:${category.id}:${roleId}`
    )
    .setTitle(
      String(
        category.label || 'Ticket'
      ).slice(0, 45)
    );

  questions
    .slice(0, 5)
    .forEach((question, i) => {
      const input = new TextInputBuilder()
        .setCustomId(`q_${i}`)
        .setLabel(
          String(question).slice(0, 45)
        )
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );
    });

  return modal;
}


/* =========================================================
   FIND NORMAL OR SERVICE CATEGORY
========================================================= */

function findTicketCategory(categoryId) {
  const normalCategory = (
    config.categories || []
  ).find(
    (category) =>
      String(category.id) === String(categoryId)
  );

  if (normalCategory) {
    return normalCategory;
  }

  const serviceCategory = (
    config.serviceCategories || []
  ).find(
    (category) =>
      String(category.id) === String(categoryId)
  );

  return serviceCategory || null;
}


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
         NORMAL / SERVICE TICKET DROPDOWNS
      ===================================================== */

      if (
        interaction.isStringSelectMenu() &&
        (
          interaction.customId ===
            'ticket_category_select' ||

          interaction.customId ===
            'service_ticket_category_select' ||

          interaction.customId ===
            'service_ticket_select'
        )
      ) {

        const selectedCategoryId =
          interaction.values?.[0];

        if (!selectedCategoryId) {

          return interaction.reply({
            content:
              '❌ No ticket category was selected.',
            ephemeral: true,
          });

        }

        const category =
          findTicketCategory(
            selectedCategoryId
          );

        if (!category) {

          if (
            interaction.customId ===
            'ticket_category_select'
          ) {
            await resetTicketDropdown(
              interaction.message
            );
          } else {
            await resetServiceTicketDropdown(
              interaction.message
            );
          }

          return interaction.reply({
            content:
              '❌ That ticket category could not be found.',
            ephemeral: true,
          });
        }


        /* =================================================
           DETERMINE WHICH PANEL WAS USED
        ================================================= */

        const isServicePanel =
          interaction.customId ===
            'service_ticket_category_select' ||
          interaction.customId ===
            'service_ticket_select';


        /* =================================================
           RESET PANEL IMMEDIATELY

           This is important because Discord select menus
           visually keep the selected value until the
           original message is edited.
        ================================================= */

        if (isServicePanel) {

          await resetServiceTicketDropdown(
            interaction.message
          );

        } else {

          await resetTicketDropdown(
            interaction.message
          );
        }


        /* =================================================
           CATEGORY HAS QUESTIONS
        ================================================= */

        if (
          Array.isArray(category.questions) &&
          category.questions.length > 0
        ) {

          await interaction.showModal(
            buildQuestionsModal(category)
          );

          return;
        }


        /* =================================================
           CATEGORY HAS NO QUESTIONS
        ================================================= */

        await createTicket(
          interaction,
          selectedCategoryId
        );

        return;
      }


      /* =====================================================
         BUTTONS
      ===================================================== */

      if (interaction.isButton()) {

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
           TICKET CLAIM
        ================================================= */

        if (
          interaction.customId ===
          'ticket_claim'
        ) {

          await claimTicket(
            interaction
          );

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
            interaction,
            null
          );

          return;
        }

        /* =================================================
           TICKET CLOSE CONFIRMATION
        ================================================= */

        if (interaction.customId === 'ticket_close_confirm') {
          await finalizeCloseTicket(interaction);
          return;
        }

        if (interaction.customId === 'ticket_close_cancel') {
          await cancelCloseTicket(interaction);
          return;
        }


        /* =================================================
           CLOSE WITH REASON
        ================================================= */

        if (
          interaction.customId ===
          'ticket_close_reason'
        ) {

          const modal =
            new ModalBuilder()
              .setCustomId(
                'ticket_close_reason_modal'
              )
              .setTitle(
                'Close Ticket'
              );

          const reasonInput =
            new TextInputBuilder()
              .setCustomId(
                'close_reason_input'
              )
              .setLabel(
                'Reason for closing'
              )
              .setStyle(
                TextInputStyle.Paragraph
              )
              .setPlaceholder(
                'e.g. Issue resolved'
              )
              .setRequired(true)
              .setMaxLength(500);

          modal.addComponents(
            new ActionRowBuilder().addComponents(
              reasonInput
            )
          );

          await interaction.showModal(
            modal
          );

          return;
        }

      }


      /* =====================================================
         CLOSE REASON MODAL
      ===================================================== */

      if (
        interaction.isModalSubmit() &&
        interaction.customId ===
          'ticket_close_reason_modal'
      ) {

        const reason =
          interaction.fields
            .getTextInputValue(
              'close_reason_input'
            )
            .trim();

        await closeTicket(
          interaction,
          reason || null
        );

        return;
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
