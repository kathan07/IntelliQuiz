import groq from "../facilites/groq.js";

const generateQuizQuestions = async (
  subject,
  grade,
  totalQuestions,
  difficulty
) => {
  const prompt = `Generate a quiz with ${totalQuestions} multiple-choice questions about ${subject} for grade ${grade} students. The difficulty level is ${difficulty}. For each question, provide the question text, 4 options, the correct answer, and a hint. Format the output as a JSON array. Make sure to keep key names as questionText for question, options for option, correctAnswer for correctAnswer and hint for hint. Dont give any questions that can't be parsed using JSON.parse function in javascript.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "mixtral-8x7b-32768",
  });
  //   console.log(completion.choices[0].message.content);
  return JSON.parse(completion.choices[0].message.content);
};

export default generateQuizQuestions;
