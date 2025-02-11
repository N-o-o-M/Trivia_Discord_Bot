import axios from "axios";
import { decode } from "html-entities";

export async function getTriviaQuestion() {
  try {
    const url = "https://opentdb.com/api.php?amount=1&type=multiple";
    const response = await axios.get(url);
    const questionData = response.data.results[0];

    let choices = [
      ...questionData.incorrect_answers,
      questionData.correct_answer,
    ].map((choice) => decode(choice));

    // Shuffle choices
    choices.sort(() => Math.random() - 0.5);

    return {
      question: decode(questionData.question),
      choices: choices,
      correctAnswer: decode(questionData.correct_answer),
      category: decode(questionData.category),
      difficulty: questionData.difficulty,
    };
  } catch (error) {
    console.error("Error fetching trivia question:", error);
    throw new Error("Failed to fetch trivia question");
  }
}
