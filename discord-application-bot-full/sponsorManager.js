const fs = require("fs");
const path = require("path");

const config = require("./config");

// Same pattern as giveawayManager.js: on Railway (and similar hosts) the
// app's own folder is wiped and rebuilt fresh on every deploy, so a file
// saved next to this script would get lost on every update. Set the
// DATA_DIR environment variable to a path inside a persistent volume and
// this will save there instead, surviving deploys/restarts. Falls back to
// this folder if DATA_DIR isn't set (fine for local/VPS use where the
// folder itself persists).
const DATA_DIR = process.env.DATA_DIR || __dirname;

try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (error) {
  console.error("Could not create sponsor data directory:", error);
}

const DATA_FILE = path.join(DATA_DIR, "sponsors.json");

function loadSponsors() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};

    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Could not load sponsors from disk:", error);
    return {};
  }
}

function saveSponsors(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Could not save sponsors to disk:", error);
  }
}

// Parses shorthand amounts like "1m", "2.5M", "1b", "0.5B" into a raw
// number. Returns null if the input doesn't match that format.
function parseAmount(input) {
  if (!input) return null;

  const match = input.trim().match(/^(\d+(?:\.\d+)?)\s*(m|b)$/i);
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (!Number.isFinite(num) || num <= 0) return null;

  const unit = match[2].toLowerCase();
  const multiplier = unit === "b" ? 1_000_000_000 : 1_000_000;

  return Math.round(num * multiplier);
}

// Formats a raw number back into shorthand (1000000 -> "1M", 1500000000 -> "1.5B").
function formatAmount(value) {
  if (value >= 1_000_000_000) {
    return trimZeros(value / 1_000_000_000) + "B";
  }
  if (value >= 1_000_000) {
    return trimZeros(value / 1_000_000) + "M";
  }
  return value.toLocaleString();
}

function trimZeros(num) {
  return Number(num.toFixed(2)).toString();
}

// Adds `amount` to userId's running total and persists it. Returns the
// new total.
function addSponsorAmount(userId, amount) {
  const data = loadSponsors();
  const newTotal = (data[userId] || 0) + amount;

  data[userId] = newTotal;
  saveSponsors(data);

  return newTotal;
}

function getSponsorTotal(userId) {
  const data = loadSponsors();
  return data[userId] || 0;
}

// Returns the config.sponsorRoles.tiers entry matching `total` (the tier
// the total currently sits in), or null if the total doesn't qualify for
// any tier yet (under 1M).
function getTierForTotal(total) {
  const tiers = config.sponsorRoles?.tiers || [];

  for (const tier of tiers) {
    const underMax = tier.max === null || total <= tier.max;
    if (total >= tier.min && underMax) {
      return tier;
    }
  }

  return null;
}

// Returns every tier whose minimum `total` has reached or passed — i.e.
// every role a member with this total should hold, from 1M-10M up through
// whichever tier they've currently reached (roles stack, they aren't
// swapped out as the member climbs).
function getQualifyingTiers(total) {
  const tiers = config.sponsorRoles?.tiers || [];
  return tiers.filter(tier => total >= tier.min);
}

module.exports = {
  parseAmount,
  formatAmount,
  addSponsorAmount,
  getSponsorTotal,
  getTierForTotal,
  getQualifyingTiers
};
