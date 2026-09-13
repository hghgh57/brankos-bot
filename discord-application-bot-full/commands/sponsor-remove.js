const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const config = require("../config");
const {
  parseAmount,
  formatAmount,
  subtractSponsorAmount,
  getQualifyingTiers
} = require("../sponsorManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sponsor-remove")
    .setDescription("Remove a sponsor amount from a user's total.")
    .setDefaultMemberPermissions(null)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to remove sponsored amount from.")
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

    const newTotal = subtractSponsorAmount(user.id, amount);
    const qualifyingTiers = getQualifyingTiers(newTotal);

    // Roles stack going up, so going down works the same way in reverse:
    // strip any tier role the member no longer qualifies for at the new
    // (lower) total, keep whatever they still qualify for.
    let roleFieldValue = "None";

    try {
      const member = await interaction.guild.members.fetch(user.id);

      const allTierRoleIds = (config.sponsorRoles?.tiers || []).map(t => t.roleId);
      const qualifyingRoleIds = new Set(qualifyingTiers.map(t => t.roleId));

      const rolesToRemove = allTierRoleIds.filter(
        id => !qualifyingRoleIds.has(id) && member.roles.cache.has(id)
      );

      if (rolesToRemove.length > 0) {
        await member.roles.remove(rolesToRemove);
      }

      roleFieldValue = rolesToRemove.length > 0
        ? rolesToRemove.map(id => `<@&${id}>`).join(", ")
        : "None";
    } catch (error) {
      console.error("❌ Failed to update sponsor role:", error);
      roleFieldValue = "⚠️ Role update failed, check my permissions/role position";
    }

    const amountDisplay = formatAmount(amount);
    const totalDisplay = formatAmount(newTotal);

    const embed = new EmbedBuilder()
      .setColor(0x0000ff)
      .setTitle("Sponsor Removed")
      .setDescription(
        `${user}'s sponsored **${amountDisplay}** got removed\n\n` +
        `**Amount Removed :** ${amountDisplay}\n` +
        `**Total Sponsored :** ${totalDisplay}\n` +
        `**Roles Removed :** ${roleFieldValue}`
      );

    await interaction.reply({
      embeds: [embed]
    });
  }
};
