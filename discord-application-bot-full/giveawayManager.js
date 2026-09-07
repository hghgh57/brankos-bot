function createGiveawayEmbed(giveaway) {
  const hasWinners = giveaway.winners.length > 0;
  const endTimestamp = Math.floor(giveaway.endTime / 1000);

  const lines = [
    hasWinners
      ? "🎉 This giveaway has ended!"
      : "Click the button below to enter!",
    "",
    `**Winners:** ${giveaway.winnerCount}`,
    `**Hosted by:** ${giveaway.host}`,
    `**Ends:** <t:${endTimestamp}:R>`,
    "",
    `<t:${endTimestamp}:F>`
  ];

  if (hasWinners) {
    lines.push(
      "",
      `**Winner(s):** ${giveaway.winners.map(id => `<@${id}>`).join(" ")}`
    );
  }

  return new EmbedBuilder()
    .setColor(0x0000ff)
    .setTitle(`${giveaway.prize}`)
    .setDescription(lines.join("\n"));
}
