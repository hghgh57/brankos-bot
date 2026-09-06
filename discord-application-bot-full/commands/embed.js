const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const BLUE = 0x0000FF;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Send an embed or plain text message.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("The message to send")
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName("title")
        .setDescription("Optional embed title")
        .setRequired(false)
    )

    .addBooleanOption(option =>
      option
        .setName("embed")
        .setDescription("True = embed, False = plain text")
        .setRequired(false)
    ),

  async execute(interaction) {
    const message = interaction.options.getString("message");
    const title = interaction.options.getString("title");
    const useEmbed = interaction.options.getBoolean("embed") ?? true;

    await interaction.reply({
      content: "Sent!",
      ephemeral: true
    });

    // PLAIN TEXT
    if (!useEmbed) {
      await interaction.channel.send(message);
      return;
    }

    // BLUE EMBED
    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setDescription(message)
      .setTimestamp();

    // TITLE IS OPTIONAL
    if (title) {
      embed.setTitle(title);
    }

    await interaction.channel.send({
      embeds: [embed]
    });
  }
};
