const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
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

    await dmChannel.send(
      `**${appConfig.emoji || "📋"} ${appConfig.name}**\n\n` +
        "I'll ask you a few questions here. Just reply with your answer " +
        "and I'll move on to the next one.\n\n" +
        "Type `cancel` at any time to stop the application."
    );

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

    for (const q of appConfig.questions) {
      const questionText =
        typeof q === "string" ? q : q.question;

      await dmChannel.send(questionText);

      const collected = await dmChannel
        .awaitMessages({
          filter: (m) => m.author.id === user.id,
          max: 1,
          time: QUESTION_TIMEOUT_MS,
          errors: ["time"]
        })
        .catch(() => null);

      if (!collected || collected.size === 0) {
        await dmChannel.send(
          "⌛ You took too long to respond. Your application has been cancelled."
        );
        return;
      }

      const message = collected.first();
      const content = message.content.trim();

      if (content.toLowerCase() === "cancel") {
        await dmChannel.send("❌ Application cancelled.");
        return;
      }

      answers.push({
        question: questionText,
        answer: content || "*No answer provided*"
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
