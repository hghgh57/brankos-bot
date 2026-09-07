const { initGiveaways } = require("../giveawayManager");

module.exports = {
  name: "ready",
  once: true,

  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);

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
