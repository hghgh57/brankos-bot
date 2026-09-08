/* =========================================================
   SERVER TAG ROLE

   Gives a role to members who display this server's tag.
   Removes the role when they remove the tag.

   Discord doesn't send a dedicated event for "user changed their
   server tag" — it comes bundled inside a GUILD_MEMBER_UPDATE
   payload. discord.js *sometimes* turns that into a "userUpdate"
   event (only when its internal diff-check notices the nested
   user object changed), so relying on "userUpdate" alone can miss
   tag changes. This version listens on BOTH "guildMemberUpdate"
   (the real, per-guild event the tag change actually rides on)
   and "userUpdate" (kept for compatibility/coverage), plus keeps
   the periodic full-member sweep as a last-resort fallback in
   case neither live event fires for a given member.
========================================================= */

const { PermissionsBitField } = require('discord.js');

const GUILD_TAG = 'BGNG';
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
  const primaryGuild = user?.primaryGuild;

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
    const me = member.guild.members.me;
    const missingPerm = !me?.permissions.has(
      PermissionsBitField.Flags.ManageRoles
    );

    if (missingPerm) {
      console.error(
        `[SERVER TAG] Cannot manage role ${ROLE_ID} — the bot is missing the "Manage Roles" permission.`
      );
    } else {
      console.error(
        `[SERVER TAG] Cannot manage role ${ROLE_ID} — my highest role must be moved ABOVE that role in Server Settings > Roles (currently my top role is at position ${me?.roles.highest.position}, the target role is at position ${targetRole.position}).`
      );
    }
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

async function syncMemberById(userId, client) {
  try {
    const { guild: targetGuild, role: targetRole } =
      findGuildAndRole(client);

    if (!targetGuild || !targetRole) {
      console.error(
        `[SERVER TAG] Could not find role ${ROLE_ID} in any guild I'm in — double check the ROLE_ID.`
      );
      return;
    }

    let member = targetGuild.members.cache.get(userId);

    if (!member) {
      member = await targetGuild.members
        .fetch(userId)
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
        `[SERVER TAG] Could not find role ${ROLE_ID} in any guild I'm in — double check the ROLE_ID.`
      );
      return;
    }

    const me = targetGuild.members.me;

    if (
      !me?.permissions.has(PermissionsBitField.Flags.ManageRoles)
    ) {
      console.error(
        '[SERVER TAG] I do not have the "Manage Roles" permission in that server — grant it, then restart.'
      );
    } else if (!targetRole.editable) {
      console.error(
        `[SERVER TAG] My highest role is below "${targetRole.name}". Move my role ABOVE it in Server Settings > Roles or the role add/remove will silently fail.`
      );
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
    await syncMemberById(newUser.id, client);
  },
};

// Extra real-time trigger: guildMemberUpdate is the event the tag
// change actually rides on. Registering it directly here (rather
// than relying only on the generic "userUpdate" wiring in
// index.js) catches tag changes that discord.js's userUpdate
// diff-check misses.
if (global.client) {
  global.client.on('guildMemberUpdate', (oldMember, newMember) => {
    syncMemberById(newMember.id, global.client).catch(console.error);
  });

  global.client.once('ready', () => {
    syncAllMembers(global.client).catch(console.error);

    setInterval(() => {
      syncAllMembers(global.client).catch(console.error);
    }, SYNC_INTERVAL_MS);
  });
}
