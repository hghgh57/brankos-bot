const {
  EmbedBuilder
} = require("discord.js");

const config = require("../config");

const activeApplications = new Set();

function cleanAnswer(text) {
  return text.length > 1000 ? text.slice(0, 1000) + "..." : text;
}

async function startApplication(interaction, type) {
  const application = config.applications[type];

  if (!application) {
    return interaction.reply({
      content: "That application does not exist.",
      ephemeral: true
    });
  }

  if (activeApplications.has(interaction.user.id)) {
    return interaction.reply({
      content: "You already have an application running. Finish it or type `cancel` in your DMs.",
      ephemeral: true
    });
  }

  activeApplications.add(interaction.user.id);

  await interaction.reply({
    content: "Check your DMs! Your application will start there.",
    ephemeral: true
  });

  try {
    const dm = await interaction.user.createDM();

    await dm.send(
      `# ${application.emoji} ${application.name}\n\n` +
      "Please answer each question one at a time.\n" +
      "Type **cancel** at any time to cancel your application."
    );

    const answers = [];

    for (let i = 0; i < application.questions.length; i++) {
      await dm.send(`**Question ${i + 1}/${application.questions.length}**\n${application.questions[i]}`);

      const collected = await dm.awaitMessages({
        filter: msg => msg.author.id === interaction.user.id,
        max: 1,
        time: 10 * 60 * 1000,
        errors: ["time"]
      });

      const answer = collected.first().content.trim();

      if (answer.toLowerCase() === "cancel") {
        await dm.send("❌ Your application has been cancelled.");
        activeApplications.delete(interaction.user.id);
        return;
      }

      answers.push(answer);
    }

    const resultChannel = await interaction.client.channels.fetch(config.applicationChannelId).catch(() => null);

    if (!resultChannel || !resultChannel.isTextBased()) {
      await dm.send("Your application was completed, but the application review channel is not configured correctly.");
      activeApplications.delete(interaction.user.id);
      return;
    }

    const resultEmbed = new EmbedBuilder()
      .setTitle(`${application.emoji} ${application.name}`)
      .setColor(0x5865F2)
      .setAuthor({
        name: interaction.user.tag,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setDescription(`**Applicant:** ${interaction.user} (${interaction.user.id})`)
      .setTimestamp();

    application.questions.forEach((question, index) => {
      resultEmbed.addFields({
        name: `Q${index + 1}. ${question}`,
        value: cleanAnswer(answers[index]) || "No answer"
      });
    });

    await resultChannel.send({ embeds: [resultEmbed] });

    await dm.send(
      "✅ **Application submitted!**\n\n" +
      "Your application has been sent to the staff team. Thank you for applying."
    );
  } catch (error) {
    console.error("Application error:", error);

    try {
      await interaction.user.send(
        "❌ Your application timed out or I couldn't send a message. Please try again."
      );
    } catch {}

  } finally {
    activeApplications.delete(interaction.user.id);
  }
}

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error running that command.",
            ephemeral: true
          }).catch(() => {});
        } else {
          await interaction.reply({
            content: "There was an error running that command.",
            ephemeral: true
          }).catch(() => {});
        }
      }

      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("application_")) {
      const type = interaction.customId.replace("application_", "");
      return startApplication(interaction, type);
    }
  }
};
