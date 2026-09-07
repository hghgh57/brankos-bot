/* =========================================================
   SERVER TAG ROLE

   Gives a role to members who display this server's tag.
   Removes the role when they remove the tag.
========================================================= */

const GUILD_TAG = 'BNGG';
const ROLE_ID = '1496926187572826242';

async function syncGuildTagRole(user, client) {
  try {
    if (!user || user.bot) return;

    /*
      Find the server that owns the role we configured.
      Role IDs are unique, so this also makes sure we only
      change the role in the correct server.
    */
    let targetGuild = null;
    let targetRole = null;

    for (const guild of client.guilds.cache.values()) {
      const role = guild.roles.cache.get(ROLE_ID);

      if (role) {
        targetGuild = guild;
        targetRole = role;
        break;
      }
    }

    if (!targetGuild || !targetRole) {
      console.error(
        `[SERVER TAG] Could not find role ${ROLE_ID}.`
      );
      return;
    }

    let member = targetGuild.members.cache.get(user.id);

    if (!member) {
      member = await targetGuild.members
        .fetch(user.id)
        .catch(() => null);
    }

    if (!member || member.user.bot) return;

    const primaryGuild = user.primaryGuild;

    const usingTag =
      primaryGuild?.identityEnabled === true &&
      String(primaryGuild?.identityGuildId) ===
        String(targetGuild.id) &&
      String(primaryGuild?.tag || '').toUpperCase() ===
        GUILD_TAG.toUpperCase();

    const hasRole = member.roles.cache.has(ROLE_ID);

    if (usingTag && !hasRole) {
      if (!targetRole.editable) {
        console.error(
          `[SERVER TAG] I cannot give role ${ROLE_ID}. Make sure my bot role is above it.`
        );
        return;
      }

      await member.roles.add(
        ROLE_ID,
        `Using server tag ${GUILD_TAG}`
      );

      console.log(
        `[SERVER TAG] Gave ${member.user.tag} the server tag role.`
      );
    }

    if (!usingTag && hasRole) {
      if (!targetRole.editable) {
        console.error(
          `[SERVER TAG] I cannot remove role ${ROLE_ID}. Make sure my bot role is above it.`
        );
        return;
      }

      await member.roles.remove(
        ROLE_ID,
        `No longer using server tag ${GUILD_TAG}`
      );

      console.log(
        `[SERVER TAG] Removed the server tag role from ${member.user.tag}.`
      );
    }
  } catch (error) {
    console.error(
      '[SERVER TAG] Failed to sync server tag role:',
      error
    );
  }
}

module.exports = {
  name: 'userUpdate',

  async execute(oldUser, newUser, client) {
    await syncGuildTagRole(
      newUser,
      client
    );
  },
};
