import { EmbedBuilder } from "discord.js";
import pool from "../db.js";

export default {
  name: "stats",
  description: "Shows your trivia statistics",
  async execute(interaction) {
    try {
      const stats = await pool.query(
        `
        SELECT 
          points,
          correct_answers,
          total_answers,
          streak,
          highest_streak,
          ROUND(CAST(correct_answers AS DECIMAL) / NULLIF(total_answers, 0) * 100, 1) as accuracy
        FROM scores 
        WHERE user_id = $1
        `,
        [interaction.user.id]
      );

      if (!stats.rows.length) {
        return await interaction.reply({
          content: "You haven't played any trivia questions yet!",
          ephemeral: true,
        });
      }

      const userData = stats.rows[0];
      const embed = new EmbedBuilder()
        .setTitle("📊 Your Trivia Statistics")
        .setColor(0x3498db)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          {
            name: "Total Points",
            value: `${userData.points}`,
            inline: true,
          },
          {
            name: "Questions Answered",
            value: `${userData.total_answers}`,
            inline: true,
          },
          {
            name: "Correct Answers",
            value: `${userData.correct_answers}`,
            inline: true,
          },
          {
            name: "Accuracy",
            value: `${userData.accuracy || 0}%`,
            inline: true,
          },
          {
            name: "Current Streak",
            value: `${userData.streak}`,
            inline: true,
          },
          {
            name: "Highest Streak",
            value: `${userData.highest_streak}`,
            inline: true,
          }
        )
        .setFooter({ text: "Keep playing to improve your stats!" });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Stats error:", error);
      await interaction.reply({
        content: "Sorry, there was an error fetching your stats!",
        ephemeral: true,
      });
    }
  },
};
