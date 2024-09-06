import mongoose from "mongoose";

// Quiz Schema
const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    gradeLevel: {
      type: Number,
      required: true,
    },
    subject: {
      type: String,
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
