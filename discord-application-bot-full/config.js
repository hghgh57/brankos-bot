module.exports = {
  // ==============================
  // CHANNEL IDS
  // ==============================

  // Channel where welcome messages are sent
  welcomeChannelId: "PUT_WELCOME_CHANNEL_ID_HERE",

  // Channel where leave messages are sent
  leaveChannelId: "PUT_LEAVE_CHANNEL_ID_HERE",

  // Channel where completed applications are sent
  applicationChannelId: "PUT_APPLICATION_CHANNEL_ID_HERE",

  // ==============================
  // PAID AD
  // ==============================
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
  // ==============================
  // APPLICATIONS
  // ==============================

  applications: {
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
      question: "Do you have previous experience as a staff member?"
    },

    {
      type: "text",
      question: "If yes, list the servers where you have been staff."
    },

    {
      type: "text",
      question: "Why do you want to join our Staff Team?"
    },

    {
      type: "yesno",
      question: "Are you able to be active every day on our server?"
    },

    {
      type: "text",
      question: "How long can you be active during the day in our server?"
    },

    {
      type: "text",
      question: "How would you handle someone breaking the rules?"
    },

    {
      type: "text",
      question: "Why should we choose you over other applicants?"
    }
  ]
},

    partner: {
      name: "Partner Manager Application",
      emoji: "🤝",

      questions: [
        "What is your Discord username and ID?",
        "How old are you?",
        "Why do you want to become a Partner Manager?",
        "How many partnerships could you realistically get each week?",
        "How would you find new servers to partner with?",
        "What makes a good partnership?",
        "Why should we choose you?"
      ]
    },

    builder: {
      name: "Builder Application",
      emoji: "🏗️",

      questions: [
        "What is your Discord username and ID?",
        "How old are you?",
        "Why do you want to become a Builder?",
        "What building experience do you have?",
        "What building tools/plugins do you know?",
        "What type of builds are you best at?",
        "Why should we choose you?"
      ]
    }
  }
};
