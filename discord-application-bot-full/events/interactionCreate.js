Library
/
interactionCreate_updated.txt


const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
} = require('discord.js');

const {
  createTicket,
  claimTicket,
  closeTicket,
  finalizeCloseTicket,
  cancelCloseTicket,
  buildTicketControlRow,
} = require('../utils/ticketManager');

const {
  hasApplied,
  clearApplied,
  buildDecisionRow,
} = require('../utils/applicationManager');

const {
  startDmApplication,
  handleDmApplicationStart,
  handleDmApplicationQuestion,
  handleDmApplicationCancel,
} = require('../utils/dmApplication');

const config = require('../config.json');
