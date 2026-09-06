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
    title: "PAID AD",
    message: "Your paid advertisement message goes here."
  },

  // ==============================
  // APPLICATIONS
  // ==============================

  applications: {
    staff: {
      name: "Staff Application",
      emoji: "🛡️",

      questions: [
        "What is your Discord username and ID?",
        "How old are you?",
        "Why do you want to become staff?",
        "What previous staff experience do you have?",
        "How active are you each week?",
        "How would you handle a member breaking the rules?",
        "Why should we choose you over other applicants?"
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
