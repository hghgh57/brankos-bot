module.exports = {
  name: "ready",
  once: true,

  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);

    client.user.setPresence({
      activities: [
        {
          name: "over BrankoGNG",
          type: 3
        }
      ],
      status: "dnd"
    });

    console.log("Status set to Watching over BrankoGNG");
  }
};
