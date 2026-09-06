module.exports = {
  name: "ready",
  once: true,

  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} server(s).`);
  }
};
