module.exports = {
  // ==================================================
  // CHANNEL IDS
  // ==================================================

  // Welcome messages are sent here
  welcomeChannelId: "PUT_WELCOME_CHANNEL_ID_HERE",

  // Leave messages are sent here
  leaveChannelId: "PUT_LEAVE_CHANNEL_ID_HERE",

  // Application panel is sent here
  applicationChannelId: "PUT_APPLICATION_CHANNEL_ID_HERE",

  // Ticket transcripts are sent here
  transcriptChannelId: "PUT_TRANSCRIPT_CHANNEL_ID_HERE",


  // ==================================================
  // PAID ADVERTISEMENT
  // ==================================================

  paidAd: {
    title: "💰 PAID ADVERTISEMENTS",

    message: `#  ** <a:coins:1538972519950848080>   __PAID ADVERTISMENTS__    **  
 
 
## <a:Pings:1538972837056876625>  •  Ping Options: 
 
### Weekday Prices : 
- ** @here = \`1,00€\`** 
- ** <@&1438912689186406411>  = \`2,50€\`** 
- ** @everyone = \`3,00€\`** 

### Weekend Prices : 
- ** @here = \`2,00€\`** 
- ** <@&1438912689186406411>   = \`3,50€\` (everyone except famous people) ** 
- ** @everyone =  \`4,00€\` (pings famous people like <@884056543576866886> , <@988883385332170872> , <@944232264856928256> , <@1389443504673128448> ) ** 
 
## <a:giftbox:1538973596817297438>  •  Addons (Recommended)  
- ** <a:6635paymentnitroclassic:1510636974657114112> Nitro Basic: \`4€\`** 
- ** <a:126620nitro:1510636789029933057> Nitro Premium \`11€\`** 
> -# More members will join for a chance to win Nitro 
 
## <:hashtag:1525836705809043537>  •  Custom Channel  
- **Channel for 1 day: \`1€\`** 
- **Channel for 3 days: \`2,5€\`** 
- **Channel for 7 days: \`5€\`** 
> -# for custom amount of days it is \`1€\` per day 
 
 
## **<:Cash:1538963818951217312>  •  __Payment Methods __** 
 
> - **PayPal <:Paypal:1531290414009684129>   ** 
> - **Crypto <:Crypto:1525835017836826665>    ** 
** All Fees must be covered by you** 
 
> #  <:Rules:1538176205063192606> Rules : 
> - **No Refunds** 
> - If your server breaks **Donut Rules or Discord Terms of Service** , your ad will be removed (or won't be posted). 
> - Once your ad is approved and posted, you cannot change the **text, ping, or the ad without prior approval.** 
> - **Payment** goes through <@1253357195479748678>  **__ONLY__**`
  },


  // ==================================================
  // TICKETS
  // ==================================================

  tickets: {

    // ==================================================
    // 🔴 SUPPORT TICKET
    // ==================================================

    support: {

      // This controls the ticket channel name
      name: "support",

      // THIS controls the button name
      label: "Support",

      // THIS controls the button emoji
      emoji: "",

      // THIS controls the ticket button colour
      color: 0xFF0000,

      // Category where the ticket is created
      categoryId: "1510706105490342131"
    },


    // ==================================================
    // 🟢 PARTNER TICKET
    // ==================================================

    partner: {

      // Ticket channel name
      name: "partner",

      // THIS controls the button name
      label: "Partner",

      // THIS controls the button emoji
      emoji: "",

      // THIS controls the ticket embed colour
      color: 0x00FF00,

      // Category where the ticket is created
      categoryId: "1510706100998111473"
    },


    // ==================================================
    // 🟢 BUY/SELL SPAWNERS TICKET
    // ==================================================

    spawners: {

      // Ticket channel name
      name: "buy-sell-spawners",

      // THIS controls the button name
      label: "Buy/Sell Spawners",

      // THIS controls the button emoji
      emoji: "",

      // THIS controls the ticket embed colour
      color: 0x00FF00,

      // Category where the ticket is created
      categoryId: "1510706100998111473"
    },


    // ==================================================
    // 🔵 SPONSOR TICKET
    // ==================================================

    sponsor: {

      // Ticket channel name
      name: "sponsor",

      // THIS controls the button name
      label: "Sponsor",

      // THIS controls the button emoji
      emoji: "",

      // THIS controls the ticket embed colour
      color: 0x0000FF,

      // Category where the ticket is created
      categoryId: "1526976384826736641"
    }
  },


  // ==================================================
  // APPLICATIONS
  // ==================================================

  applications: {

    // ==================================================
    // 🛡️ STAFF APPLICATION
    // ==================================================

    staff: {
      name: "Staff Application",
      emoji: "🛡️",

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


    // ==================================================
    // 🤝 PARTNER MANAGER APPLICATION
    // ==================================================

    partner: {
      name: "Partner Manager Application",
      emoji: "🤝",

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


    // ==================================================
    // 🏗️ BUILDER APPLICATION
    // ==================================================

    builder: {
      name: "Builder Application",
      emoji: "🏗️",

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
