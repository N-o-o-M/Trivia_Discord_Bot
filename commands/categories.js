import { EmbedBuilder } from "discord.js";
import pool from "../db.js";

export default {
  name: "categories",
  description: "Shows your performance in different trivia categories",
  async execute(interaction) {
    try {
      const stats = await pool.query(
        `
        SELECT 
          category,
          correct_answers,
          total_answers,
          ROUND(CAST(correct_answers AS DECIMAL) / total_answers * 100, 1) as accuracy
        FROM category_stats 
        WHERE user_id = $1
        ORDER BY total_answers DESC, accuracy DESC
        LIMIT 10
        `,
        [interaction.user.id]
      );

      if (!stats.rows.length) {
        return await interaction.reply({
          content: "You haven't played any trivia questions yet!",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("📊 Your Category Statistics")
        .setColor(0x3498db)
        .setThumbnail(interaction.user.displayAvatarURL());

      stats.rows.forEach((row) => {
        embed.addFields({
          name: row.category,
          value: `Correct: ${row.correct_answers}/${row.total_answers} (${row.accuracy}%)`,
          inline: true,
        });
      });

      embed.setFooter({
        text: "Keep playing to improve your stats!",
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Categories error:", error);
      await interaction.reply({
        content: "Sorry, there was an error fetching your category stats!",
        ephemeral: true,
      });
    }
  },
};
