import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  answers: [
    {
      questionIndex: {
        type: Number,
        required: true,
      },
      selectedAnswer: {
        type: String,
        required: true,
      },
    },
  ],
  score: {
    type: Number,
    required: true,
  },
  feedback: [
    {
      type: String,
    },
  ],
  suggestionsToImprove: [
    {
      type: String,
    },
  ],
  completedDate: {
    type: Date,
    default: Date.now,
    index: true,  // Index for date filtering
  },
  isRetry: {
    type: Boolean,
    default: false,
  },
  previousSubmissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Submission",
  },
});

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
