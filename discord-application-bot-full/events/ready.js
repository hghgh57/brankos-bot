const { initGiveaways } = require("../giveawayManager");

module.exports = {
  name: "ready",
  once: true,

  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);

    // Fully cache every guild's members so guildMemberRemove
    // fires correctly for people who were already in the server
    // before this bot process started (not just ones who joined
    // or spoke while it's been running).
    for (const guild of client.guilds.cache.values()) {
      try {
        const members = await guild.members.fetch();
        console.log(
          `👥 Cached ${members.size} members for ${guild.name}`
        );
      } catch (error) {
        console.error(
          `❌ Failed to cache members for ${guild.name}:`,
          error
        );
      }
    }

    updateMemberCount(client);
    initGiveaways(client);
  }
};

function updateMemberCount(client) {
  const totalMembers = client.guilds.cache.reduce(
    (total, guild) => total + guild.memberCount,
    0
  );

  client.user.setPresence({
    activities: [
      {
        name: `over ${totalMembers} members`,
        type: 3
      }
    ],
    status: "online"
  });

  console.log(
    `Status: Watching over ${totalMembers} members`
  );
}
