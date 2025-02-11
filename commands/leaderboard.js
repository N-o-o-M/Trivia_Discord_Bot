import { EmbedBuilder } from "discord.js";
import pool from "../db.js";

export default {
  name: "leaderboard",
  description: "Displays the trivia leaderboard.",
  async execute(interaction) {
    try {
      const res = await pool.query(
        `SELECT username, points FROM scores ORDER BY points DESC LIMIT 10`
      );

      const medals = ["🥇", "🥈", "🥉"];
      let leaderboard = res.rows
        .map(
          (row, i) =>
            `${medals[i] || "👤"} **${row.username}** - ${row.points} points`
        )
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle("🏆 Trivia Leaderboard")
        .setDescription(leaderboard || "No scores yet!")
        .setColor(0xffd700)
        .setFooter({ text: "Play trivia to climb the ranks!" });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Leaderboard error:", error);
      await interaction.reply({
        content: "Sorry, there was an error fetching the leaderboard!",
        ephemeral: true,
      });
    }
  },
};
