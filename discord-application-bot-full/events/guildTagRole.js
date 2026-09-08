/* =========================================================
   SERVER TAG ROLE

   Gives a role to members who display this server's tag.
   Removes the role when they remove the tag.

   Discord doesn't reliably send a gateway event when someone
   changes their server tag (it's an undocumented/inconsistent
   part of the API), so on top of the real-time "userUpdate"
   listener below, this file also runs a periodic sweep over
   every member as a fallback so the role always ends up correct
   even if the live event never fires.
========================================================= */

const GUILD_TAG = 'BNGG';
const ROLE_ID = '1496926187572826242';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function findGuildAndRole(client) {
  for (const guild of client.guilds.cache.values()) {
    const role = guild.roles.cache.get(ROLE_ID);

    if (role) {
      return { guild, role };
    }
  }

  return { guild: null, role: null };
}

function isUsingTag(user, targetGuildId) {
  const primaryGuild = user.primaryGuild;

  return (
    primaryGuild?.identityEnabled === true &&
    String(primaryGuild?.identityGuildId) ===
      String(targetGuildId) &&
    String(primaryGuild?.tag || '').toUpperCase() ===
      GUILD_TAG.toUpperCase()
  );
}

async function applyRoleForMember(member, targetRole) {
  if (!member || member.user.bot) return;

  const usingTag = isUsingTag(
    member.user,
    member.guild.id
  );

  const hasRole = member.roles.cache.has(ROLE_ID);

  if (usingTag === hasRole) return;

  if (!targetRole.editable) {
    console.error(
      `[SERVER TAG] I cannot change role ${ROLE_ID}. Make sure my bot role is above it.`
    );
    return;
  }

  if (usingTag && !hasRole) {
    await member.roles.add(
      ROLE_ID,
      `Using server tag ${GUILD_TAG}`
    );

    console.log(
      `[SERVER TAG] Gave ${member.user.tag} the server tag role.`
    );
  } else if (!usingTag && hasRole) {
    await member.roles.remove(
      ROLE_ID,
      `No longer using server tag ${GUILD_TAG}`
    );

    console.log(
      `[SERVER TAG] Removed the server tag role from ${member.user.tag}.`
    );
  }
}

async function syncGuildTagRole(user, client) {
  try {
    if (!user || user.bot) return;

    let targetGuild = null;
    let targetRole = null;

    ({ guild: targetGuild, role: targetRole } =
      findGuildAndRole(client));

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

    await applyRoleForMember(member, targetRole);
  } catch (error) {
    console.error(
      '[SERVER TAG] Failed to sync server tag role:',
      error
    );
  }
}

async function syncAllMembers(client) {
  try {
    const { guild: targetGuild, role: targetRole } =
      findGuildAndRole(client);

    if (!targetGuild || !targetRole) {
      console.error(
        `[SERVER TAG] Could not find role ${ROLE_ID}.`
      );
      return;
    }

    const members = await targetGuild.members.fetch();

    for (const member of members.values()) {
      await applyRoleForMember(member, targetRole).catch(
        error =>
          console.error(
            `[SERVER TAG] Failed to sync ${member.user.tag}:`,
            error
          )
      );
    }
  } catch (error) {
    console.error(
      '[SERVER TAG] Failed to run periodic server tag sync:',
      error
    );
  }
}

module.exports = {
  name: 'userUpdate',

  async execute(oldUser, newUser, client) {
    await syncGuildTagRole(newUser, client);
  },
};

// Periodic fallback sweep, started once the bot is ready.
if (global.client) {
  global.client.once('ready', () => {
    syncAllMembers(global.client).catch(console.error);

    setInterval(() => {
      syncAllMembers(global.client).catch(console.error);
    }, SYNC_INTERVAL_MS);
  });
}
