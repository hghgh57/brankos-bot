const { EmbedBuilder } = require("discord.js");
const config = require("../config");

const BLUE = 0x5865F2;

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
    content: "📩 Check your DMs! Your application will start there.",
    ephemeral: true
  });

  try {
    const dm = await interaction.user.createDM();

    const startEmbed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle(`${application.emoji} ${application.name}`)
      .setDescription(
        "Thank you for applying!\n\n" +
        "You will be asked a few questions. Please answer each question one at a time.\n\n" +
        "❌ **Type `cancel` at any time to cancel your application.**"
      )
      .setFooter({
        text: interaction.guild?.name || "Application"
      })
      .setTimestamp();

    await dm.send({
      embeds: [startEmbed]
    });

    const answers = [];

    for (let i = 0; i < application.questions.length; i++) {
      const questionEmbed = new EmbedBuilder()
        .setColor(BLUE)
        .setTitle(`${application.emoji} ${application.name}`)
        .setDescription(
          `**Question ${i + 1}/${application.questions.length}**\n\n` +
          application.questions[i] +
          "\n\n" +
          "💬 Type your answer below.\n" +
          "❌ Type `cancel` to cancel."
        )
        .setFooter({
          text: `Question ${i + 1} of ${application.questions.length}`
        });

      await dm.send({
        embeds: [questionEmbed]
      });

      const collected = await dm.awaitMessages({
        filter: msg => msg.author.id === interaction.user.id,
        max: 1,
        time: 10 * 60 * 1000,
        errors: ["time"]
      });

      const answer = collected.first().content.trim();

      if (answer.toLowerCase() === "cancel") {
        const cancelEmbed = new EmbedBuilder()
          .setColor(BLUE)
          .setTitle("❌ Application Cancelled")
          .setDescription(
            "Your application has been cancelled.\n\n" +
            "You can start a new application whenever you are ready."
          )
          .setTimestamp();

        await dm.send({
          embeds: [cancelEmbed]
        });

        activeApplications.delete(interaction.user.id);
        return;
      }

      answers.push(answer);

      if (i < application.questions.length - 1) {
        const receivedEmbed = new EmbedBuilder()
          .setColor(BLUE)
          .setDescription(
            `✅ **Answer ${i + 1} received.**\n\n` +
            `Moving on to question ${i + 2}.`
          );

        await dm.send({
          embeds: [receivedEmbed]
        });
      }
    }

    const resultChannel = await interaction.client.channels
      .fetch(config.applicationChannelId)
      .catch(() => null);

    if (!resultChannel || !resultChannel.isTextBased()) {
      const errorEmbed = new EmbedBuilder()
        .setColor(BLUE)
        .setTitle("❌ Application Error")
        .setDescription(
          "Your application was completed, but the application review channel has not been configured correctly.\n\n" +
          "Please contact a staff member."
        )
        .setTimestamp();

      await dm.send({
        embeds: [errorEmbed]
      });

      activeApplications.delete(interaction.user.id);
      return;
    }

    const resultEmbed = new EmbedBuilder()
      .setTitle(`${application.emoji} ${application.name}`)
      .setColor(BLUE)
      .setAuthor({
        name: interaction.user.tag,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setDescription(
        `**Applicant:** ${interaction.user}\n` +
        `**User ID:** \`${interaction.user.id}\``
      )
      .setTimestamp();

    application.questions.forEach((question, index) => {
      resultEmbed.addFields({
        name: `Q${index + 1}. ${question}`,
        value: cleanAnswer(answers[index]) || "No answer"
      });
    });

    await resultChannel.send({
      embeds: [resultEmbed]
    });

    const submittedEmbed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle("✅ Application Submitted")
      .setDescription(
        `Your **${application.name}** has been successfully submitted!\n\n` +
        "The staff team will review your application. Thank you for applying! ❤️"
      )
      .setTimestamp();

    await dm.send({
      embeds: [submittedEmbed]
    });

  } catch (error) {
    console.error("Application error:", error);

    try {
      const timeoutEmbed = new EmbedBuilder()
        .setColor(BLUE)
        .setTitle("❌ Application Ended")
        .setDescription(
          "Your application timed out or I couldn't send you a message.\n\n" +
          "Please try starting the application again."
        )
        .setTimestamp();

      await interaction.user.send({
        embeds: [timeoutEmbed]
      });
    } catch {}

  } finally {
    activeApplications.delete(interaction.user.id);
  }
}

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(
        interaction.commandName
      );

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

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("application_")
    ) {
      const type = interaction.customId.replace("application_", "");

      return startApplication(interaction, type);
    }
  }
};
