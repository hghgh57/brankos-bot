const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  createGiveaway
} = require("../giveawayManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gcreate")
    .setDescription("Start a giveaway.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    )

    .addStringOption(option =>
      option
        .setName("title")
        .setDescription("The giveaway title.")
        .setRequired(true)
        .setMaxLength(256)
    )

    .addIntegerOption(option =>
      option
        .setName("winners")
        .setDescription("How many winners.")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )

    .addStringOption(option =>
      option
        .setName("duration")
        .setDescription("Examples: 7d, 24h, 30m, 1h")
        .setRequired(true)
        .setMaxLength(20)
    ),

  async execute(interaction) {
    const title =
      interaction.options.getString("title");

    const winners =
      interaction.options.getInteger("winners");

    const duration =
      interaction.options.getString("duration");

    await createGiveaway(
      interaction,
      title,
      winners,
      duration
    );
  }
};
