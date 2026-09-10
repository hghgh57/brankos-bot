const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sponsor-info")
    .setDescription("Show the sponsor role tiers.")
    .setDefaultMemberPermissions(null),

  async execute(interaction) {
    const content =
      "**1M-10M**: <@&1504931998798446764> \n" +
      "**10M-25M**: <@&1515770869517914243> \n" +
      "**25M-50M**: <@&1515770944252149830> \n" +
      "**50M-75M**: <@&1515771316307755088>\n" +
      "**75M-100M**: <@&1515771454312939721> \n\n" +
      "**100M-250M**: <@&1515772812466458675> \n" +
      "**250M-500M**: <@&1515773022357819463> \n" +
      "**500M-1B**: <@&1515774272986026165> \n" +
      "**1B+**: <@&1515774819864547582> \n" +
      "**Highest sponsor : <@&1547581798177833012>  **";

    await interaction.reply({
      content,
      allowedMentions: { roles: [] } // remove this line if you want the roles to actually ping
    });
  }
};
