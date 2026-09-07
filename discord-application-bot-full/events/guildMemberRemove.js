/**
 * guildMemberRemove.js — sends a message when someone leaves the server.
 *
 * ⚠️ BEFORE THIS WILL WORK, TWO THINGS OUTSIDE THIS FILE MUST BE TRUE:
 *
 * 1. In your main bot file (often index.js / bot.js), the Client must be
 *    created with the GuildMembers intent:
 *
 *      const client = new Client({
 *        intents: [
 *          GatewayIntentBits.Guilds,
 *          GatewayIntentBits.GuildMembers,   // <-- required for this event
 *          GatewayIntentBits.GuildMessages,
 *        ],
 *      });
 *
 * 2. That intent must ALSO be turned on in the Discord Developer Portal:
 *      discord.com/developers/applications
 *        -> your application -> Bot -> Privileged Gateway Intents
 *        -> toggle ON "Server Members Intent"
 *
 *    If either of these is missing, guildMemberRemove silently never
 *    fires — no error, nothing in the console, it just never happens.
 *    This is the #1 cause of "leave message doesn't send" bugs.
 *
 * Drop this file in your bot's events folder (wherever guildMemberAdd.js
 * or similar lives) and make sure it's being loaded/registered the same
 * way your other events are.
 */

// Set this to the channel ID where leave messages should be posted.
const LEAVE_CHANNEL_ID = "1438877108452593765";

module.exports = {
  name: "guildMemberRemove",
  once: false,

  async execute(member) {
    // member.user can be missing if this was a partial/uncached member —
    // guard against that instead of crashing.
    const tag =
      member.user?.tag ||
      member.user?.username ||
      member.id ||
      "Someone";

    console.log(
      `🚪 guildMemberRemove fired: ${tag} left ${member.guild?.name ?? "unknown guild"}`
    );

    try {
      if (!LEAVE_CHANNEL_ID || LEAVE_CHANNEL_ID === "PUT_YOUR_LEAVE_CHANNEL_ID_HERE") {
        console.error(
          "❌ LEAVE_CHANNEL_ID is not set. Edit guildMemberRemove.js and add your channel ID."
        );
        return;
      }

      // Fetch (not just cache.get) so this works even if the channel
      // isn't cached yet.
      const channel = await member.guild.channels
        .fetch(LEAVE_CHANNEL_ID)
        .catch(error => {
          console.error("❌ Could not fetch leave channel:", error);
          return null;
        });

      if (!channel) {
        console.error(`❌ Leave channel ${LEAVE_CHANNEL_ID} was not found.`);
        return;
      }

      if (!channel.isTextBased()) {
        console.error(`❌ Leave channel ${LEAVE_CHANNEL_ID} is not text-based.`);
        return;
      }

      // Make sure the bot actually has permission to post there —
      // this fails silently otherwise in a lot of setups.
      const me = member.guild.members.me;
      const perms = me ? channel.permissionsFor(me) : null;

      if (perms && (!perms.has("ViewChannel") || !perms.has("SendMessages"))) {
        console.error(
          `❌ Missing permission to view/send in leave channel ${LEAVE_CHANNEL_ID}.`
        );
        return;
      }

      const username = member.user?.username || "Someone";

      await channel.send(
        `${username} has left the server. We hope you come back soon! 😢❤️`
      );

      console.log(`✅ Leave message sent for ${username}.`);
    } catch (error) {
      console.error("❌ LEAVE EVENT ERROR:", error);
    }
  },
};
