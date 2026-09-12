const fs = require("fs");
const path = require("path");

const autoPingFile = path.join(__dirname, "autoping.json");

let savedAutoPingChannelId = undefined;

try {
  const raw = fs.readFileSync(autoPingFile, "utf8");
  savedAutoPingChannelId = JSON.parse(raw).channelId;
} catch (error) {
  // File doesn't exist yet — no auto-ping channel set. That's fine.
}

console.log(
  savedAutoPingChannelId
    ? `✅ Loaded auto-ping channel from autoping.json: ${savedAutoPingChannelId}`
    : "ℹ️ No autoping.json found on startup — no auto-ping channel set yet."
);

module.exports = {
  autoPingChannelId: savedAutoPingChannelId,

  // Role that, in addition to the normal Discord permission check,
  // is allowed to use /gcreate, /greroll, /ez, /lock and /unlock.
  staffRoleId: "1484216939466461376",

  welcomeChannelId: "1546583079706165449",
  leaveChannelId: "1546583079706165449",
  applicationChannelId: "1546629316568158301",
  transcriptChannelId: "1546682107881988186",

  paidAd: {
    title: "",

    message: `# **<a:coins:1538972519950848080> __PAID ADVERTISMENTS__**

## <a:Pings:1538972837056876625> • Ping Options:

### Weekday Prices:
- **@here = \`1,00€\`**
- **<@&1438912689186406411> = \`2,50€\`**
- **@everyone = \`3,00€\`**

### Weekend Prices:
- **@here = \`2,00€\`**
- **<@&1438912689186406411> = \`3,50€\` (everyone except famous people)**
- **@everyone = \`4,00€\` (pings famous people like <@884056543576866886>, <@988883385332170872>, <@944232264856928256>, <@1126535625370259486>  and others!)**

## <a:giftbox:1538973596817297438> • Addons (Recommended)
- **<a:6635paymentnitroclassic:1510636974657114112> Nitro Basic: \`4€\`**
- **<a:126620nitro:1510636789029933057> Nitro Premium: \`11€\`**
> -# More members will join for a chance to win Nitro

## <:hashtag:1525836705809043537> • Custom Channel
- **Channel for 1 day: \`1€\`**
- **Channel for 3 days: \`2,5€\`**
- **Channel for 7 days: \`5€\`**
> -# for custom amount of days it is \`1€\` per day

## **<:Cash:1538963818951217312> • __Payment Methods__**
- **PayPal <:Paypal:1531290414009684129>**
- **Crypto <:Crypto:1525835017836826665>**
**All Fees must be covered by you**

> # <:Rules:1538176205063192606> Rules:
> - **No Refunds**
> - **If your server breaks Donut Rules or Discord Terms of Service, your ad will be removed (or won't be posted).**
> - **Once your ad is approved and posted, you cannot change the text, ping, or the ad without prior approval.**
> - **Payment goes through <@1253357195479748678> __ONLY__**`,

    // Shown ephemerally (only to the clicker) by the Member Visibility
    // button on /advertisement-info.
    memberVisibility: `## <:1513266373743218818:1531297976314630214>  • Member Visibility
- **50 Member Visibility: \`1,00€\`**
- **100 Member Visibility: \`1,75€\`**
- **250 Member Visibility: \`4,25€\`**
- **500 Member Visibility: \`8,50€\`**
-# when member joins the server they recieve a dm with your server ad`,

    // Shown ephemerally (only to the clicker) by the Bundles button on
    // /advertisement-info.
    bundles: `## <:Box:1548317902283870268>  • Bundles

### Golden bundle
- **@everyone + 7d Custom Channel  = \`8€\`**
-# save 1€!
### Diamond bundle
- **@everyone + 4d Custom Channel + Nitro Premium  = \`15€\`**
-# save 2,50€!
### Netherite bundle
- **@everyone + 14d Custom Channel + Nitro Premium = \`20€\`**
-# save 6€!`
  },

  tickets: {
    panel: {
      title: "8B | Branko's community",

      description:
        "Thanks for reaching out, feel free to make a ticket.\n\n" +
        "Click a button below to open a ticket in the relevant category.\n\n" +
        "Only open a ticket if you genuinely need help.\n\n" +
        "Brankos community support"
    },

    support: {
      name: "support",
      label: "Support",
      color: 0x0000FF,
      categoryId: "1546612381248000130",
      roleId: "1484216939466461376"
    },

    bug: {
      name: "bug",
      label: "Bug",
      color: 0xFF0000,
      categoryId: "1546612460436455565",
      roleId: "1533223723182592011"
    },

    partner: {
      name: "partner",
      label: "Partner",
      color: 0x0000FF,
      categoryId: "1546612282732191745",
      roleId: "1484216939466461376"
    },

    spawners: {
      name: "buy-sell-spawners",
      label: "Buy/Sell Spawners",
      color: 0x0000FF,
      categoryId: "1546612756365705318",
      roleId: "1442590696774172764"
    },

    sponsor: {
      name: "sponsor",
      label: "Sponsor",
      color: 0x0000FF,
      categoryId: "1546612524059721758",
      roleId: "1484216939466461376"
    },

    buy_ad: {
      name: "buy-ad",
      label: "Buy Ad",
      color: 0x0000FF,
      categoryId: "1546870894712848394",
      roleId: "1533223723182592011"
    },

    // Used by the buttons in commands/service-tickets.js
    // (service_ticket_open_dig_out / service_ticket_open_request_build).
    // Replace these placeholder IDs with a real category + role ID.
    dig_out: {
      name: "dig-out",
      label: "Dig Out",
      color: 0x0000FF,
      categoryId: "1548002581719031848",
      roleId: "1484216939466461376"
    },

    request_build: {
      name: "request-build",
      label: "Request Build",
      color: 0x0000FF,
      categoryId: "1548002494964170762",
      roleId: "1484216939466461376"
    },

    // Used by giveawayManager.js when a giveaway winner claims their prize.
    // categoryId isn't used there (the claim ticket's category is set
    // directly in giveawayManager.js) — this entry exists so /ticket-close,
    // /ticket-add, and /rename-ticket recognize claim tickets as tickets
    // and know which role can manage them.
    giveaway: {
      name: "giveaway-claim",
      label: "Giveaway Claim",
      color: 0x0000FF,
      categoryId: "1546682658359087167",
      roleId: "1484216939466461376"
    }
  },

  applications: {
    staff: {
      name: "Staff Application",
      emoji: "",

      // Only members with this role can start a Staff Application.
      requiredRoleId: "1500496895586336808",

      questions: [
        {
          type: "text",
          question: "What is your Discord username and ID?"
        },
        {
          type: "yesno",
          question: "Do you have previous staff experience?"
        },
        {
          type: "text",
          question: "If yes, where have you previously been staff?"
        },
        {
          type: "yesno",
          question: "Are you able to be active every day?"
        },
        {
          type: "text",
          question: "Why do you want to become staff?"
        },
        {
          type: "text",
          question: "How would you handle someone breaking the rules?"
        },
        {
          type: "text",
          question: "Why should we choose you?"
        }
      ]
    },

    partner: {
      name: "Partner Manager Application",
      emoji: "",

      questions: [
        {
          type: "text",
          question: "What is your Discord username and ID?"
        },
        {
          type: "text",
          question: "How old are you?"
        },
        {
          type: "text",
          question: "Why do you want to become a Partner Manager?"
        },
        {
          type: "text",
          question: "How many partnerships could you realistically get each week?"
        },
        {
          type: "text",
          question: "How would you find new servers to partner with?"
        },
        {
          type: "text",
          question: "What makes a good partnership?"
        },
        {
          type: "text",
          question: "Why should we choose you?"
        }
      ]
    },

    builder: {
      name: "Builder Application",
      emoji: "",

      questions: [
        {
          type: "text",
          question: "What is your Discord username and ID?"
        },
        {
          type: "text",
          question: "How old are you?"
        },
        {
          type: "text",
          question: "Why do you want to become a Builder?"
        },
        {
          type: "text",
          question: "What building experience do you have?"
        },
        {
          type: "text",
          question: "What building tools/plugins do you know?"
        },
        {
          type: "text",
          question: "What type of builds are you best at?"
        },
        {
          type: "text",
          question: "Why should we choose you?"
        }
      ]
    }
  }
};
