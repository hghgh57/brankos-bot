const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const config = require("../config");
const {
  parseAmount,
  formatAmount,
  addSponsorAmount,
  getTierForTotal
} = require("../sponsorManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sponsor-add")
    .setDescription("Add a sponsor amount to a user's total.")
    .setDefaultMemberPermissions(null)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user who sponsored.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("amount")
        .setDescription("Amount, e.g. 1M or 1B")
        .setRequired(true)
        .setMaxLength(20)
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }

    const hasPermission = interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    );
    const hasStaffRole = interaction.member.roles.cache.has(
      config.staffRoleId
    );

    if (!hasPermission && !hasStaffRole) {
      return interaction.reply({
        content: "❌ You need the Manage Server permission (or the staff role) to use this command.",
        ephemeral: true
      });
    }

    const user = interaction.options.getUser("user", true);
    const rawAmount = interaction.options.getString("amount", true);

    const amount = parseAmount(rawAmount);

    if (amount === null) {
      return interaction.reply({
        content: "❌ Invalid amount. Use a number followed by M or B, e.g. `1M`, `2.5M`, `1B`.",
        ephemeral: true
      });
    }

    const newTotal = addSponsorAmount(user.id, amount);
    const tier = getTierForTotal(newTotal);

    // Assign the earned tier role, swapping out any older tier role so
    // the member only ever holds the one matching their current total.
    let roleMention = "None yet (needs 1M+ total)";

    try {
      const member = await interaction.guild.members.fetch(user.id);
      const tierRoleIds = (config.sponsorRoles?.tiers || []).map(t => t.roleId);

      if (tier) {
        const rolesToRemove = tierRoleIds.filter(
          id => id !== tier.roleId && member.roles.cache.has(id)
        );

        if (rolesToRemove.length > 0) {
          await member.roles.remove(rolesToRemove);
        }

        if (!member.roles.cache.has(tier.roleId)) {
          await member.roles.add(tier.roleId);
        }

        roleMention = `<@&${tier.roleId}>`;
      }
    } catch (error) {
      console.error("❌ Failed to update sponsor role:", error);
      roleMention = tier
        ? `<@&${tier.roleId}> (⚠️ role assignment failed, check my permissions/role position)`
        : roleMention;
    }

    const amountDisplay = formatAmount(amount);
    const totalDisplay = formatAmount(newTotal);

    const embed = new EmbedBuilder()
      .setColor(0x0000ff)
      .setTitle("Sponsor Added")
      .setDescription(
        `${user} sponsored **${amountDisplay}**\n\n` +
        `**Amount Added :** ${amountDisplay}\n` +
        `**Total Sponsored :** ${totalDisplay}\n` +
        `**Role Added :** ${roleMention}`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }
};
