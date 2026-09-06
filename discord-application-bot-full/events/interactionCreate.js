const {
  EmbedBuilder
} = require("discord.js");

const config = require("../config");

const {
  createTicket,
  closeTicket
} = require("../ticketManager");

const BLUE = 0x0000ff;

const activeApplications = new Set();

function getQuestionText(question) {
  if (typeof question === "string") {
    return question;
  }

  if (question && typeof question.question === "string") {
    return question.question;
  }

  return "Question not configured correctly.";
}

function isYesNoQuestion(question) {
  return (
    typeof question === "object" &&
    question.type === "yesno"
  );
}

function cleanAnswer(text) {
  if (!text) return "No answer";

  return text.length > 1000
    ? text.slice(0, 1000) + "..."
    : text;
}


// ==========================================
// START APPLICATION
// ==========================================

async function startApplication(interaction, type) {

  const application = config.applications[type];

  if (!application) {
    return interaction.reply({
      content: "❌ That application does not exist.",
      ephemeral: true
    });
  }

  if (activeApplications.has(interaction.user.id)) {
    return interaction.reply({
      content:
        "❌ You already have an application running. Type `cancel` in your DMs to cancel it.",
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

    // ==========================================
    // START MESSAGE
    // ==========================================

    const startEmbed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle(`${application.emoji} ${application.name}`)
      .setDescription(
        "Thank you for applying!\n\n" +
        "You will be asked a few questions.\n\n" +
        "Answer each question one at a time.\n\n" +
        "❌ Type `cancel` at any time to cancel."
      )
      .setFooter({
        text: interaction.guild?.name || "Application"
      })
      .setTimestamp();

    await dm.send({
      embeds: [startEmbed]
    });

    const answers = [];

    // ==========================================
    // QUESTIONS
    // ==========================================

    for (
      let i = 0;
      i < application.questions.length;
      i++
    ) {

      const currentQuestion =
        application.questions[i];

      const questionText =
        getQuestionText(currentQuestion);

      const yesNo =
        isYesNoQuestion(currentQuestion);

      // ========================================
      // YES / NO QUESTION
      // ========================================

      if (yesNo) {

        const questionEmbed = new EmbedBuilder()
          .setColor(BLUE)
          .setTitle(`${application.emoji} ${application.name}`)
          .setDescription(
            `**Question ${i + 1}/${application.questions.length}**\n\n` +
            `${questionText}\n\n` +
            `Type **yes** or **no**.\n\n` +
            `❌ Type \`cancel\` to cancel.`
          )
          .setFooter({
            text: `Question ${i + 1} of ${application.questions.length}`
          })
          .setTimestamp();

        await dm.send({
          embeds: [questionEmbed]
        });

        let answer;

        while (!answer) {

          try {

            const collected = await dm.awaitMessages({
              filter: message =>
                message.author.id ===
                interaction.user.id,

              max: 1,

              time: 10 * 60 * 1000,

              errors: ["time"]
            });

            const response =
              collected.first().content
                .trim()
                .toLowerCase();

            // CANCEL

            if (response === "cancel") {

              await dm.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(BLUE)
                    .setTitle("❌ Application Cancelled")
                    .setDescription(
                      "Your application has been cancelled."
                    )
                    .setTimestamp()
                ]
              });

              return;
            }

            // YES

            if (response === "yes") {

              answer = "Yes";

            }

            // NO

            else if (response === "no") {

              answer = "No";

            }

            // INVALID ANSWER

            else {

              await dm.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(BLUE)
                    .setDescription(
                      "❌ Please answer with **yes** or **no**."
                    )
                ]
              });

            }

          } catch {

            await dm.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(BLUE)
                  .setTitle("⏰ Application Timed Out")
                  .setDescription(
                    "You took too long to answer the question.\n\n" +
                    "Please start the application again."
                  )
                  .setTimestamp()
              ]
            });

            return;
          }
        }

        // Save answer

        answers.push({
          question: questionText,
          answer: answer
        });

        // Reply with Yes / No

        await dm.send({
          embeds: [
            new EmbedBuilder()
              .setColor(BLUE)
              .setDescription(`**${answer}**`)
          ]
        });

      }

      // ========================================
      // NORMAL QUESTION
      // ========================================

      else {

        const questionEmbed = new EmbedBuilder()
          .setColor(BLUE)
          .setTitle(`${application.emoji} ${application.name}`)
          .setDescription(
            `**Question ${i + 1}/${application.questions.length}**\n\n` +
            `${questionText}\n\n` +
            `💬 Type your answer below.\n\n` +
            `❌ Type \`cancel\` to cancel.`
          )
          .setFooter({
            text: `Question ${i + 1} of ${application.questions.length}`
          })
          .setTimestamp();

        await dm.send({
          embeds: [questionEmbed]
        });

        try {

          const collected = await dm.awaitMessages({
            filter: message =>
              message.author.id ===
              interaction.user.id,

            max: 1,

            time: 10 * 60 * 1000,

            errors: ["time"]
          });

          const answer =
            collected.first().content.trim();

          // CANCEL

          if (
            answer.toLowerCase() === "cancel"
          ) {

            await dm.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(BLUE)
                  .setTitle("❌ Application Cancelled")
                  .setDescription(
                    "Your application has been cancelled."
                  )
                  .setTimestamp()
              ]
            });

            return;
          }

          // Save answer

          answers.push({
            question: questionText,
            answer: answer
          });

        } catch {

          await dm.send({
            embeds: [
              new EmbedBuilder()
                .setColor(BLUE)
                .setTitle("⏰ Application Timed Out")
                .setDescription(
                  "You took too long to answer the question.\n\n" +
                  "Please start the application again."
                )
                .setTimestamp()
            ]
          });

          return;
        }
      }

      // ========================================
      // NO "ANSWER RECEIVED" MESSAGE
      // ========================================
      // The next question starts immediately.

    }

    // ==========================================
    // APPLICATION CHANNEL
    // ==========================================

    const resultChannel =
      await interaction.client.channels
        .fetch(config.applicationChannelId)
        .catch(() => null);

    if (
      !resultChannel ||
      !resultChannel.isTextBased()
    ) {

      await dm.send({
        embeds: [
          new EmbedBuilder()
            .setColor(BLUE)
            .setTitle("❌ Application Error")
            .setDescription(
              "Your application was completed, but the application review channel is not configured correctly."
            )
            .setTimestamp()
        ]
      });

      return;
    }

    // ==========================================
    // APPLICATION RESULT
    // ==========================================

    const resultEmbed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle(
        `${application.emoji} ${application.name}`
      )
      .setAuthor({
        name: interaction.user.tag,
        iconURL:
          interaction.user.displayAvatarURL()
      })
      .setDescription(
        `**Applicant:** ${interaction.user}\n` +
        `**User ID:** \`${interaction.user.id}\``
      )
      .setTimestamp();

    answers.forEach((item, index) => {

      resultEmbed.addFields({
        name:
          `Q${index + 1}. ${item.question}`,

        value:
          cleanAnswer(item.answer)
      });

    });

    await resultChannel.send({
      embeds: [resultEmbed]
    });

    // ==========================================
    // SUBMITTED
    // ==========================================

    await dm.send({
      embeds: [
        new EmbedBuilder()
          .setColor(BLUE)
          .setTitle("✅ Application Submitted")
          .setDescription(
            `Your **${application.name}** has been successfully submitted!\n\n` +
            "The staff team will review your application.\n\n" +
            "Thank you for applying! ❤️"
          )
          .setTimestamp()
      ]
    });

  } catch (error) {

    console.error(
      "Application error:",
      error
    );

    try {

      await interaction.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(BLUE)
            .setTitle("❌ Application Error")
            .setDescription(
              "Something went wrong with your application. Please try again."
            )
            .setTimestamp()
        ]
      });

    } catch {}

  } finally {

    activeApplications.delete(
      interaction.user.id
    );

  }
}


// ==========================================
// INTERACTION CREATE
// ==========================================

module.exports = {

  name: "interactionCreate",

  async execute(interaction) {

    // ========================================
    // SLASH COMMANDS
    // ========================================

    if (interaction.isChatInputCommand()) {

      const command =
        interaction.client.commands.get(
          interaction.commandName
        );

      if (!command) return;

      try {

        await command.execute(interaction);

      } catch (error) {

        console.error(error);

        if (
          interaction.replied ||
          interaction.deferred
        ) {

          await interaction.followUp({
            content:
              "There was an error running that command.",
            ephemeral: true
          }).catch(() => {});

        } else {

          await interaction.reply({
            content:
              "There was an error running that command.",
            ephemeral: true
          }).catch(() => {});

        }
      }

      return;
    }


    // ========================================
    // TICKETS
    // ========================================

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("ticket_")
    ) {

      if (
        interaction.customId ===
        "ticket_close"
      ) {

        return closeTicket(interaction);

      }

      const type =
        interaction.customId.replace(
          "ticket_",
          ""
        );

      if (config.tickets[type]) {

        return createTicket(
          interaction,
          type
        );

      }
    }


    // ========================================
    // APPLICATION BUTTONS
    // ========================================

    if (
      interaction.isButton() &&
      interaction.customId.startsWith(
        "application_"
      )
    ) {

      const type =
        interaction.customId.replace(
          "application_",
          ""
        );

      return startApplication(
        interaction,
        type
      );
    }
  }
};
