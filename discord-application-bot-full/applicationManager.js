const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ComponentType
} = require("discord.js");

const config = require("./config");

const BLUE = 0x0000FF;
const GREEN = 0x00FF00;
const RED = 0xFF0000;

// Per-question timeout for the DM flow.
const QUESTION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// Tracks who currently has an application in progress, so they can't
// start a second one (and so a stray DM doesn't get treated as an
// answer to two applications at once). Keyed by user id.
const inProgress = new Set();

/* =========================================================
   START AN APPLICATION (DM Q&A FLOW)
========================================================= */

async function startApplication(interaction, type) {
  const appConfig = config.applications[type];

  if (!appConfig) {
    return interaction.reply({
      content: "❌ This application type does not exist.",
      ephemeral: true
    });
  }

  const user = interaction.user;

  // Gate certain applications (e.g. Staff) behind a required role.
  if (appConfig.requiredRoleId) {
    const member = interaction.member;

    if (
      !member ||
      !member.roles.cache.has(appConfig.requiredRoleId)
    ) {
      return interaction.reply({
        content:
          `❌ You need <@&${appConfig.requiredRoleId}> to start a ${appConfig.name}.`,
        ephemeral: true
      });
    }
  }

  if (inProgress.has(user.id)) {
    return interaction.reply({
      content:
        "❌ You already have an application in progress in your DMs.",
      ephemeral: true
    });
  }

  let dmChannel;

  try {
    dmChannel = await user.createDM();

    const introEmbed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle("Application Started")
      .setDescription(
        "Please answer the questions below, either by clicking on the dropdown menus or sending a message to the bot."
      );

    await dmChannel.send({ embeds: [introEmbed] });

  } catch (error) {
    return interaction.reply({
      content:
        "❌ I couldn't DM you. Please enable direct messages from server members and try again.",
      ephemeral: true
    });
  }

  await interaction.reply({
    content: "📬 Check your DMs, I've sent you the application!",
    ephemeral: true
  });

  inProgress.add(user.id);

  try {
    const answers = [];

    // One message that gets edited in place from question to question,
    // instead of sending a new message per question.
    let questionMessage = null;

    for (let i = 0; i < appConfig.questions.length; i++) {
      const q = appConfig.questions[i];

      const questionText =
        typeof q === "string" ? q : q.question;

      const questionType =
        typeof q === "string" ? "text" : q.type || "text";

      const result = await askQuestion({
        dmChannel,
        user,
        appConfig,
        questionMessage,
        questionText,
        questionType,
        index: i,
        total: appConfig.questions.length
      });

      if (result === null) {
        // Cancelled or timed out; askQuestion already messaged the user.
        return;
      }

      questionMessage = result.message;

      answers.push({
        question: questionText,
        answer: result.answer
      });
    }

    await submitApplication(
      interaction,
      type,
      appConfig,
      user,
      answers,
      dmChannel
    );

  } finally {
    inProgress.delete(user.id);
  }
}

/* =========================================================
   ASK ONE QUESTION (TEXT OR YES/NO)
   Sends (or edits) a single blue embed with a red Cancel
   button, plus Yes/No buttons for "yesno" questions.
   Returns { answer, message } or null if the user cancelled
   or timed out (in which case this already messaged them).
========================================================= */

async function askQuestion({
  dmChannel,
  user,
  appConfig,
  questionMessage,
  questionText,
  questionType,
  index,
  total
}) {
  const embed = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle(`${appConfig.emoji || "📋"} ${appConfig.name}`)
    .setDescription(questionText)
    .setFooter({ text: `Question ${index + 1}/${total}` });

  const buttons = [];

  if (questionType === "yesno") {
    buttons.push(
      new ButtonBuilder()
        .setCustomId("app_yesno_yes")
        .setLabel("Yes")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("app_yesno_no")
        .setLabel("No")
        .setStyle(ButtonStyle.Danger)
    );
  }

  buttons.push(
    new ButtonBuilder()
      .setCustomId("app_cancel")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Danger)
  );

  const row = new ActionRowBuilder().addComponents(buttons);

  const payload = { embeds: [embed], components: [row] };

  const sent = questionMessage
    ? await questionMessage.edit(payload)
    : await dmChannel.send(payload);

  // Text answers only make sense for "text" questions; yes/no
  // questions are answered purely via buttons.
  const messageListener =
    questionType === "text"
      ? dmChannel
          .awaitMessages({
            filter: (m) => m.author.id === user.id,
            max: 1,
            time: QUESTION_TIMEOUT_MS,
            errors: ["time"]
          })
          .catch(() => null)
      : null;

  const buttonListener = sent
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (btnInteraction) =>
        btnInteraction.user.id === user.id,
      time: QUESTION_TIMEOUT_MS
    })
    .catch(() => null);

  const listeners = messageListener
    ? [messageListener, buttonListener]
    : [buttonListener];

  const result = await Promise.race(listeners);

  // Disable buttons on the message so the old ones can't be reused;
  // the next question (or the cancelled/timeout state) will overwrite
  // this again right after.
  const disabledRow = new ActionRowBuilder().addComponents(
    row.components.map((b) =>
      ButtonBuilder.from(b).setDisabled(true)
    )
  );

  await sent.edit({ components: [disabledRow] }).catch(() => {});

  // Timed out (neither a message nor a button arrived).
  if (!result) {
    await dmChannel.send(
      "⌛ You took too long to respond. Your application has been cancelled."
    );
    return null;
  }

  // A button was clicked (Yes / No / Cancel).
  if (result.customId) {
    if (result.customId === "app_cancel") {
      await result.deferUpdate().catch(() => {});
      await dmChannel.send("❌ Application cancelled.");
      return null;
    }

    await result.deferUpdate().catch(() => {});

    const answer =
      result.customId === "app_yesno_yes" ? "Yes" : "No";

    return { answer, message: sent };
  }

  // A text message was sent instead.
  const message = result.first();
  const content = message.content.trim();

  if (content.toLowerCase() === "cancel") {
    await dmChannel.send("❌ Application cancelled.");
    return null;
  }

  return {
    answer: content || "*No answer provided*",
    message: sent
  };
}

/* =========================================================
   SUBMIT COMPLETED APPLICATION TO REVIEW CHANNEL
========================================================= */

async function submitApplication(
  interaction,
  type,
  appConfig,
  user,
  answers,
  dmChannel
) {
  const reviewChannelId = config.applicationChannelId;

  const reviewChannel = reviewChannelId
    ? await interaction.guild.channels
        .fetch(reviewChannelId)
        .catch(() => null)
    : null;

  if (!reviewChannel || !reviewChannel.isTextBased()) {
    await dmChannel.send(
      "❌ Something went wrong submitting your application. Please contact staff."
    );
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle(`${appConfig.emoji || "📋"} ${appConfig.name}`)
    .setDescription(`Applicant: ${user} (${user.tag})`)
    .setTimestamp();

  for (const { question, answer } of answers) {
    embed.addFields({
      name: question.slice(0, 256),
      value: answer.slice(0, 1024) || "*No answer provided*"
    });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`application_accept:${type}:${user.id}`)
      .setLabel("Accept")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`application_deny:${type}:${user.id}`)
      .setLabel("Deny")
      .setStyle(ButtonStyle.Danger)
  );

  await reviewChannel.send({
    embeds: [embed],
    components: [row]
  });

  await dmChannel.send(
    "✅ Your application has been submitted! You'll be notified here once it's reviewed."
  );
}

/* =========================================================
   HANDLE ACCEPT / DENY BUTTON
========================================================= */

async function handleApplicationDecision(interaction) {
  const isAccept = interaction.customId.startsWith(
    "application_accept:"
  );

  const prefix = isAccept
    ? "application_accept:"
    : "application_deny:";

  const [type, applicantId] = interaction.customId
    .slice(prefix.length)
    .split(":");

  const appConfig = config.applications[type];

  const member = interaction.member;

  if (
    !member ||
    !member.permissions.has(PermissionFlagsBits.ManageGuild)
  ) {
    return interaction.reply({
      content:
        "❌ You do not have permission to review applications.",
      ephemeral: true
    });
  }

  await interaction.deferUpdate();

  const applicant = await interaction.client.users
    .fetch(applicantId)
    .catch(() => null);

  const decisionWord = isAccept ? "accepted" : "denied";

  if (applicant) {
    await applicant
      .send(
        `${isAccept ? "✅" : "❌"} Your **${
          appConfig?.name || type
        }** application has been **${decisionWord}** by ${interaction.user.tag}.`
      )
      .catch(() => {});
  }

  const originalEmbed = interaction.message.embeds[0];

  const updatedEmbed = originalEmbed
    ? EmbedBuilder.from(originalEmbed)
        .setColor(isAccept ? GREEN : RED)
        .setFooter({
          text: `${isAccept ? "Accepted" : "Denied"} by ${interaction.user.tag}`
        })
    : null;

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("application_accept_disabled")
      .setLabel("Accept")
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId("application_deny_disabled")
      .setLabel("Deny")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true)
  );

  await interaction.editReply({
    embeds: updatedEmbed ? [updatedEmbed] : undefined,
    components: [disabledRow]
  });
}

module.exports = {
  startApplication,
  handleApplicationDecision
};
