import groq from "../facilites/groq.js";

const evaluateQuizAnswers = async (questions, userAnswers, maxScore) => {
  const questionsWithAnswers = questions.map((q, index) => ({
    question: q.text,
    correctAnswer: q.correctAnswer,
    userAnswer: userAnswers[index].selectedAnswer,
  }));

  const prompt = `Evaluate the following quiz answers and provide a score out of ${maxScore}, along with feedback for each question and two suggestions to improve skills based on the responses. Format the output as JSON with keys: score (a number), feedback (an array of strings), and suggestionsToImprove (an array of strings). Ensure that feedback and suggestionsToImprove are arrays of strings and not objects.
    
      Quiz answers: ${JSON.stringify(questionsWithAnswers)}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "mixtral-8x7b-32768",
    });

    // console.log(completion.choices[0].message.content);

    const parsedResponse = JSON.parse(completion.choices[0].message.content);

    // Ensure feedback and suggestionsToImprove are arrays of strings
    if (!Array.isArray(parsedResponse.feedback)) {
      parsedResponse.feedback = [parsedResponse.feedback].filter(Boolean);
    }
    if (!Array.isArray(parsedResponse.suggestionsToImprove)) {
      parsedResponse.suggestionsToImprove = [
        parsedResponse.suggestionsToImprove,
      ].filter(Boolean);
    }

    return parsedResponse;
  } catch (error) {
    console.error("Error evaluating quiz answers:", error);
    throw new Error("Failed to evaluate quiz answers");
  }
};

export default evaluateQuizAnswers;
