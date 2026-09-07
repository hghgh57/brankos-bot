const config = require("../config");

const {
  createTicket,
  closeTicket
} = require("../ticketManager");

const {
  joinGiveaway,
  claimGiveaway
} = require("../giveawayManager");

function getQuestionText(question) {
  if (typeof question === "string") {
    return question;
  }

  if (
    question &&
    typeof question.question === "string"
  ) {
    return question.question;
  }

  return "Question";
}

function isYesNoQuestion(question) {
  return (
    question &&
    typeof question === "object" &&
    question.type === "yesno"
  );
}

async function startApplication(
  interaction,
  type
) {
  const application =
    config.applications[type];

  if (!application) {
    return interaction.reply({
      content:
        "❌ This application does not exist.",
      ephemeral: true
    });
  }

  await interaction.reply({
    content: "Check your DMs!",
    ephemeral: true
  });

  const user = interaction.user;

  try {
    const dm = await user.createDM();

    await dm.send(
      `${application.name}\n\n` +
      "Please answer the following questions one at a time.\n\n" +
      "Type `cancel` at any time to cancel your application."
    );

    const answers = [];

    for (
      let i = 0;
      i < application.questions.length;
      i++
    ) {
      const question =
        application.questions[i];

      const questionText =
        getQuestionText(question);

      await dm.send(
        `Question ${i + 1}/${application.questions.length}\n\n` +
        questionText
      );

      if (isYesNoQuestion(question)) {
        await dm.send(
          "Please answer with yes or no."
        );
      }

      let answered = false;

      while (!answered) {
        const collected =
          await dm.awaitMessages({
            filter: message =>
              message.author.id === user.id,

            max: 1,
            time: 300000
          }).catch(() => null);

        if (
          !collected ||
          collected.size === 0
        ) {
          await dm.send(
            "Your application timed out. Please start again."
          );

          return;
        }

        const message =
          collected.first();

        const answer =
          message.content.trim();

        if (
          answer.toLowerCase() ===
          "cancel"
        ) {
          await dm.send(
            "Your application has been cancelled."
          );

          return;
        }

        if (isYesNoQuestion(question)) {
          const lower =
            answer.toLowerCase();

          if (
            lower !== "yes" &&
            lower !== "no"
          ) {
            await dm.send(
              "Please answer with yes or no."
            );

            continue;
          }

          answers.push(answer);

          await dm.send(
            lower === "yes"
              ? "Yes"
              : "No"
          );

          answered = true;
        } else {
          answers.push(answer);
          answered = true;
        }
      }
    }

    let applicationText =
      `${application.name}\n` +
      `Applicant: ${user.tag}\n` +
      `User ID: ${user.id}\n\n`;

    for (
      let i = 0;
      i < application.questions.length;
      i++
    ) {
      applicationText +=
        `Question ${i + 1}: ` +
        `${getQuestionText(
          application.questions[i]
        )}\n`;

      applicationText +=
        `Answer: ${
          answers[i] || "No answer"
        }\n\n`;
    }

    if (config.applicationChannelId) {
      const channel =
        interaction.client.channels.cache.get(
          config.applicationChannelId
        );

      if (
        channel &&
        channel.isTextBased()
      ) {
        await channel.send(
          applicationText
        );
      }
    }

    await dm.send(
      "Your application has been submitted. Thank you!"
    );
  } catch (error) {
    console.error(
      "Application error:",
      error
    );

    try {
      await user.send(
        "I could not start your application. Please make sure your DMs are open."
      );
    } catch {}
  }
}

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {
    try {
      /*
       * SLASH COMMANDS
       */

      if (
        interaction.isChatInputCommand()
      ) {
        const command =
          interaction.client.commands.get(
            interaction.commandName
          );

        if (!command) return;

        await command.execute(
          interaction
        );

        return;
      }

      /*
       * BUTTONS
       */

      if (!interaction.isButton()) {
        return;
      }

      /*
       * GIVEAWAY JOIN
       */

      if (
        interaction.customId.startsWith(
          "giveaway_join_"
        )
      ) {
        const giveawayId =
          interaction.customId.replace(
            "giveaway_join_",
            ""
          );

        await joinGiveaway(
          interaction,
          giveawayId
        );

        return;
      }

      /*
       * GIVEAWAY CLAIM
       */

      if (
        interaction.customId.startsWith(
          "giveaway_claim_"
        )
      ) {
        const giveawayId =
          interaction.customId.replace(
            "giveaway_claim_",
            ""
          );

        await claimGiveaway(
          interaction,
          giveawayId
        );

        return;
      }

      /*
       * CLOSE TICKET
       */

      if (
        interaction.customId ===
        "ticket_close"
      ) {
        await closeTicket(
          interaction
        );

        return;
      }

      /*
       * SUPPORT TICKET
       */

      if (
        interaction.customId ===
        "ticket_support"
      ) {
        await createTicket(
          interaction,
          "support"
        );

        return;
      }

      /*
       * BUG TICKET
       */

      if (
        interaction.customId ===
        "ticket_bug"
      ) {
        await createTicket(
          interaction,
          "bug"
        );

        return;
      }

      /*
       * PARTNER TICKET
       */

      if (
        interaction.customId ===
        "ticket_partner"
      ) {
        await createTicket(
          interaction,
          "partner"
        );

        return;
      }

      /*
       * SPAWNERS TICKET
       */

      if (
        interaction.customId ===
        "ticket_spawners"
      ) {
        await createTicket(
          interaction,
          "spawners"
        );

        return;
      }

      /*
       * SPONSOR TICKET
       */

      if (
        interaction.customId ===
        "ticket_sponsor"
      ) {
        await createTicket(
          interaction,
          "sponsor"
        );

        return;
      }

      /*
       * APPLICATIONS
       */

      if (
        interaction.customId ===
        "application_staff"
      ) {
        await startApplication(
          interaction,
          "staff"
        );

        return;
      }

      if (
        interaction.customId ===
        "application_partner"
      ) {
        await startApplication(
          interaction,
          "partner"
        );

        return;
      }

      if (
        interaction.customId ===
        "application_builder"
      ) {
        await startApplication(
          interaction,
          "builder"
        );

        return;
      }

    } catch (error) {
      console.error(
        "Interaction error:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "❌ Something went wrong.",
          ephemeral: true
        }).catch(() => {});
      }
    }
  }
};
