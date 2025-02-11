import { EmbedBuilder } from "discord.js";
import pool from "../db.js";

export default {
  name: "streak",
  description: "Shows your current trivia streak.",
  async execute(interaction) {
    try {
      const res = await pool.query(
        `SELECT streak FROM scores WHERE user_id = $1`,
        [interaction.user.id]
      );

      if (res.rows.length === 0) {
        return await interaction.reply({
          content: "You haven't played any trivia questions yet!",
          ephemeral: true,
        });
      }

      const streak = res.rows[0].streak;

      const embed = new EmbedBuilder()
        .setTitle("🔥 Your Current Streak")
        .setDescription(
          `Your current streak is: **${streak}** correct answers in a row!`
        )
        .setColor(0x00ff00);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Streak error:", error);
      await interaction.reply({
        content: "Sorry, there was an error fetching your streak!",
        ephemeral: true,
      });
    }
  },
};
