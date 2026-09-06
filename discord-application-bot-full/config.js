module.exports = {
  // Change these whenever you want.
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID || "",
  leaveChannelId: process.env.LEAVE_CHANNEL_ID || "",
  applicationChannelId: process.env.APPLICATION_CHANNEL_ID || "",

  // The questions are intentionally simple so you can replace them.
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
