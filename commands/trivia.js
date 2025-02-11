import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { getTriviaQuestion } from "../trivia.js";
import pool from "../db.js";

async function updateStats(userId, username, category, isCorrect, pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Update main stats
    const userStats = await client.query(
      `
      INSERT INTO scores (user_id, username, points, correct_answers, total_answers, streak, highest_streak, last_answer_time)
      VALUES ($1, $2, $3, $4, 1, $5, $5, NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET 
        points = scores.points + $3,
        correct_answers = scores.correct_answers + $4,
        total_answers = scores.total_answers + 1,
        streak = CASE 
          WHEN $4 = 1 THEN scores.streak + 1
          ELSE 0 
        END,
        highest_streak = CASE 
          WHEN $4 = 1 AND scores.streak + 1 > scores.highest_streak THEN scores.streak + 1
          ELSE scores.highest_streak 
        END,
        last_answer_time = NOW(),
        username = $2
      RETURNING streak
      `,
      [
        userId,
        username,
        isCorrect ? 10 : 0,
        isCorrect ? 1 : 0,
        isCorrect ? 1 : 0,
      ]
    );

    // Update category stats
    await client.query(
      `
      INSERT INTO category_stats (user_id, category, correct_answers, total_answers)
      VALUES ($1, $2, $3, 1)
      ON CONFLICT (user_id, category) DO UPDATE
      SET 
        correct_answers = category_stats.correct_answers + $3,
        total_answers = category_stats.total_answers + 1
      `,
      [userId, category, isCorrect ? 1 : 0]
    );

    await client.query("COMMIT");
    return userStats.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default {
  name: "trivia",
  description: "Starts a trivia question.",
  async execute(interaction) {
    try {
      const trivia = await getTriviaQuestion();

      const buttons = trivia.choices.map((choice) =>
        new ButtonBuilder()
          .setCustomId(`answer_${choice}`)
          .setLabel(choice)
          .setStyle(ButtonStyle.Primary)
      );

      const row = new ActionRowBuilder().addComponents(buttons);

      const embed = new EmbedBuilder()
        .setTitle("🎯 Trivia Question")
        .setDescription(trivia.question)
        .addFields(
          { name: "Category", value: trivia.category, inline: true },
          { name: "Difficulty", value: trivia.difficulty, inline: true }
        )
        .setColor(0x0099ff)
        .setFooter({ text: "You have 15 seconds to answer!" });

      const response = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true,
      });

      const filter = (i) => {
        return (
          i.user.id === interaction.user.id && i.message.id === response.id
        );
      };

      try {
        const confirmation = await response.awaitMessageComponent({
          filter,
          time: 15000,
        });

        const selectedAnswer = confirmation.customId.replace("answer_", "");
        const correct = selectedAnswer === trivia.correctAnswer;

        try {
          const stats = await updateStats(
            confirmation.user.id,
            confirmation.user.username,
            trivia.category,
            correct,
            pool
          );

          const resultEmbed = new EmbedBuilder()
            .setTitle(correct ? "✅ Correct!" : "❌ Wrong!")
            .setDescription(
              correct
                ? `Well done! You got it right!\n🔥 Streak: ${stats.streak}`
                : `The correct answer was: **${trivia.correctAnswer}**\n💔 Streak lost!`
            )
            .setColor(correct ? 0x00ff00 : 0xff0000)
            .addFields(
              {
                name: "Category",
                value: trivia.category,
                inline: true,
              },
              {
                name: "Difficulty",
                value: trivia.difficulty,
                inline: true,
              }
            );

          if (stats.streak && stats.streak % 5 === 0) {
            resultEmbed.addFields({
              name: "🎉 Achievement Unlocked!",
              value: `${stats.streak} correct answers in a row!`,
            });
          }

          await confirmation.update({
            embeds: [resultEmbed],
            components: [],
          });
        } catch (error) {
          console.error("Error updating stats:", error);
          await confirmation.update({
            content: "There was an error updating your stats!",
            components: [],
          });
        }
      } catch (e) {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("⏳ Time's Up!")
          .setDescription(`The correct answer was: **${trivia.correctAnswer}**`)
          .setColor(0xff6b6b);

        await interaction.editReply({
          embeds: [timeoutEmbed],
          components: [],
        });
      }
    } catch (error) {
      console.error("Trivia command error:", error);
      if (!interaction.replied) {
        await interaction.reply({
          content: "Sorry, there was an error getting the trivia question!",
          ephemeral: true,
        });
      }
    }
  },
};

function decodeHTMLEntities(text) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}
