const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  startGiveaway
} = require("../giveawayManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription(
      "Start a giveaway."
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageMessages
    )

    .addStringOption(option =>
      option
        .setName("prize")
        .setDescription(
          "What are you giving away?"
        )
        .setRequired(true)
    )

    .addIntegerOption(option =>
      option
        .setName("winners")
        .setDescription(
          "Number of winners"
        )
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )

    .addStringOption(option =>
      option
        .setName("duration")
        .setDescription(
          "Example: 10m, 1h, 7d"
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    const prize =
      interaction.options.getString(
        "prize"
      );

    const winners =
      interaction.options.getInteger(
        "winners"
      );

    const duration =
      interaction.options.getString(
        "duration"
      );

    const result =
      await startGiveaway({
        interaction,
        prize,
        winners,
        duration
      });

    if (!result.success) {
      return interaction.reply({
        content:
          `❌ ${result.error}`,
        ephemeral: true
      });
    }

    await interaction.reply({
      content:
        "✅ Giveaway created!",
      ephemeral: true
    });
  }
};
