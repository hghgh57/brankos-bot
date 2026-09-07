const {
  EmbedBuilder
} = require("discord.js");

const BLUE = 0x0000FF;

const stickyMessages = new Map();

async function sendSticky(channel, content) {
  const embed = new EmbedBuilder()
    .setColor(BLUE)
    .setDescription(content);

  const message = await channel.send({
    embeds: [embed]
  });

  return message;
}

async function setSticky(channel, content) {
  try {
    const oldSticky = stickyMessages.get(
      channel.id
    );

    if (oldSticky) {
      const oldMessage = await channel.messages
        .fetch(oldSticky.messageId)
        .catch(() => null);

      if (oldMessage) {
        await oldMessage.delete().catch(() => {});
      }
    }

    const message = await sendSticky(
      channel,
      content
    );

    stickyMessages.set(channel.id, {
      messageId: message.id,
      content
    });

    return {
      success: true
    };
  } catch (error) {
    console.error(
      "❌ Sticky message error:",
      error
    );

    return {
      success: false,
      error: "I could not create the sticky message."
    };
  }
}

async function removeSticky(channel) {
  const sticky = stickyMessages.get(
    channel.id
  );

  if (!sticky) {
    return {
      success: false,
      error: "There is no sticky message in this channel."
    };
  }

  try {
    const message = await channel.messages
      .fetch(sticky.messageId)
      .catch(() => null);

    if (message) {
      await message.delete().catch(() => {});
    }

    stickyMessages.delete(channel.id);

    return {
      success: true
    };
  } catch (error) {
    console.error(
      "❌ Unstick error:",
      error
    );

    return {
      success: false,
      error: "I could not remove the sticky message."
    };
  }
}

async function handleStickyMessage(message) {
  if (message.author.bot) return;

  const sticky = stickyMessages.get(
    message.channel.id
  );

  if (!sticky) return;

  const oldMessage = await message.channel.messages
    .fetch(sticky.messageId)
    .catch(() => null);

  if (oldMessage) {
    await oldMessage.delete().catch(() => {});
  }

  const newMessage = await sendSticky(
    message.channel,
    sticky.content
  );

  stickyMessages.set(message.channel.id, {
    messageId: newMessage.id,
    content: sticky.content
  });
}

module.exports = {
  setSticky,
  removeSticky,
  handleStickyMessage
};
