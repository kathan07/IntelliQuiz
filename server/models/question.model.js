import mongoose from "mongoose";

// Question Schema
const questionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  options: [
    {
      type: String,
      required: true,
    },
  ],
  correctAnswer: {
    type: String,
    required: true,
  },
  hint: {
    type: String,
  },
});

const Question = mongoose.model("Question", questionSchema);
export default Question;