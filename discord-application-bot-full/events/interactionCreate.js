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

async function startApplication(interaction, type) {
  const application = config.applications[type];

  if (!application) {
    return interaction.reply({
      content: "❌ This application does not exist.",
      ephemeral: true
    });
  }

  if (type === "staff") {
    const coalMinerRoleId = "1500496895586336808";

    const member = await interaction.guild.members
      .fetch(interaction.user.id)
      .catch(() => null);

    if (
      !member ||
      !member.roles.cache.has(coalMinerRoleId)
    ) {
      return interaction.reply({
        content:
          "❌ You must have the @Coal Miner [5] role to apply for Staff.",
        ephemeral: true
      });
    }
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
      const question = application.questions[i];

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

        const message = collected.first();
        const answer =
          message.content.trim();

        if (
          answer.toLowerCase() === "cancel"
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

          answers.push(
            lower === "yes" ? "Yes" : "No"
          );

          answered = true;
        } else {
          answers.push(answer);
          answered = true;
        }
      }
    }

    let applicationText = "";

    for (
      let i = 0;
      i < application.questions.length;
      i++
    ) {
      applicationText +=
        `**Question ${i + 1}:**\n` +
        `${getQuestionText(application.questions[i])}\n` +
        `**Answer:**\n` +
        `${answers[i] || "No answer"}\n\n`;
    }

    if (config.applicationChannelId) {
      const channel =
        await interaction.client.channels
          .fetch(config.applicationChannelId)
          .catch(() => null);

      if (
        channel &&
        channel.isTextBased()
      ) {
        const {
          EmbedBuilder,
          ActionRowBuilder,
          ButtonBuilder,
          ButtonStyle
        } = require("discord.js");

        const embed =
          new EmbedBuilder()
            .setColor(0x0000FF)
            .setTitle(
              application.name
            )
            .setDescription(
              `Applicant: ${user}\n\n` +
              applicationText
            )
            .setFooter({
              text: `User ID: ${user.id}`
            })
            .setTimestamp();

        const row =
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(
                `application_accept_${type}_${user.id}`
              )
              .setLabel("Accept")
              .setStyle(
                ButtonStyle.Success
              ),

            new ButtonBuilder()
              .setCustomId(
                `application_deny_${type}_${user.id}`
              )
              .setLabel("Deny")
              .setStyle(
                ButtonStyle.Danger
              )
          );

        await channel.send({
          content: `${user}`,
          embeds: [embed],
          components: [row]
        });
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
      if (interaction.isChatInputCommand()) {
        const command =
          interaction.client.commands.get(
            interaction.commandName
          );

        if (!command) return;

        await command.execute(interaction);
        return;
      }

      if (!interaction.isButton()) {
        return;
      }

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

      if (
        interaction.customId ===
        "ticket_close"
      ) {
        await closeTicket(interaction);
        return;
      }

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

      // Service tickets

      if (
        interaction.customId ===
        "service_ticket_open_dig_out"
      ) {
        await createTicket(
          interaction,
          "dig_out"
        );
        return;
      }

      if (
        interaction.customId ===
        "service_ticket_open_request_build"
      ) {
        await createTicket(
          interaction,
          "request_build"
        );
        return;
      }

      if (
        interaction.customId ===
        "service_ticket_open_buy_ad"
      ) {
        await createTicket(
          interaction,
          "buy_ad"
        );
        return;
      }

      // Applications

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

      if (
        interaction.customId.startsWith(
          "application_accept_"
        )
      ) {
        await interaction.update({
          components: []
        });

        await interaction.followUp({
          content:
            "✅ Application accepted.",
          ephemeral: true
        });

        return;
      }

      if (
        interaction.customId.startsWith(
          "application_deny_"
        )
      ) {
        await interaction.update({
          components: []
        });

        await interaction.followUp({
          content:
            "❌ Application denied.",
          ephemeral: true
        });

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
