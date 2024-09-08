import groq from "../facilites/groq.js";

const getHint = async (question) => {
  const prompt = `Generate a helpful hint for the following question without giving away the answer: "${question.text}"`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "mixtral-8x7b-32768",
  });
  // console.log(completion.choices[0].message.content);
  return completion.choices[0].message.content;
};

export default getHint;
