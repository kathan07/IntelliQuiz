import mongoose from "mongoose";

// Quiz Schema
const quizSchema = new mongoose.Schema(
  {
    grade: {
      type: Number,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
