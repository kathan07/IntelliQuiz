import errorHandler from "../utils/error.js";
import Quiz from "../models/quiz.model.js";
import Question from "../models/question.model.js";
import Submission from "../models/submission.model.js";
import generateQuizQuestions from "../helpers/getQuiz.js";
import evaluateQuizAnswers from "../helpers/evaluateQuiz.js";
import getHint from "../helpers/getHint.js";
import sendQuizResultEmail from "../facilites/nodemail.js";
import { setCache, getCache } from "../facilites/redis.js";

export const generateQuiz = async (req, res, next) => {
  try {
    const { grade, Subject, TotalQuestions, MaxScore, Difficulty } = req.body;

    if (!grade || !Subject || !TotalQuestions || !MaxScore || !Difficulty) {
      next(errorHandler(400, "All fields are required"));
    }

    const generatedQuestions = await generateQuizQuestions(
      Subject,
      grade,
      TotalQuestions,
      Difficulty
    );

    const quiz = new Quiz({
      grade,
      subject: Subject,
      totalQuestions: TotalQuestions,
      maxScore: MaxScore,
      difficulty: Difficulty,
    });

    const questionPromises = generatedQuestions.map(async (q) => {
      const question = new Question({
        quizId: quiz._id,
        text: q.questionText,
        options: [q.options[0], q.options[1], q.options[2], q.options[3]],
        correctAnswer: q.correctAnswer,
        hint: q.hint,
      });
      await question.save();
      return question._id;
    });

    quiz.questions = await Promise.all(questionPromises);
    await quiz.save();

    res.status(201).json({
      message: "Quiz generated successfully",
      quiz: {
        id: quiz._id,
        grade: quiz.grade,
        subject: quiz.subject,
        totalQuestions: quiz.totalQuestions,
        maxScore: quiz.maxScore,
        difficulty: quiz.difficulty,
        questions: generatedQuestions.map((q) => ({
          text: q.questionText,
          options: [q.options[0], q.options[1], q.options[2], q.options[3]],
        })),
      },
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    next(error);
  }
};

export const submitQuizAnswers = async (req, res, next) => {
  try {
    const { quizId, answers } = req.body;
    const user = req.user;
    const userId = user._id;

    if (!quizId || !answers || !Array.isArray(answers)) {
      return next(errorHandler(400, "All fields are required"));
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return next(errorHandler(404, "Quiz not found"));
    }

    // Fetch all questions for this quiz
    const questions = await Question.find({ _id: { $in: quiz.questions } });

    if (questions.length !== answers.length) {
      return next(
        errorHandler(
          400,
          "Number of answers does not match number of questions"
        )
      );
    }

    const evaluation = await evaluateQuizAnswers(
      questions,
      answers,
      quiz.maxScore
    );

    const submission = new Submission({
      userId,
      quizId,
      answers: answers.map((answer, index) => ({
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
      })),
      score: evaluation.score,
      feedback: evaluation.feedback,
      suggestionsToImprove: evaluation.suggestionsToImprove,
    });

    await submission.save();

    try {
      await sendQuizResultEmail(user.email, {
        score: evaluation.score,
        maxScore: quiz.maxScore,
        feedback: evaluation.feedback,
        suggestionsToImprove: evaluation.suggestionsToImprove,
      });
    } catch (error) {
      console.log(error);
    }

    res.status(200).json({
      message: "Quiz submitted and evaluated successfully",
      submission: {
        id: submission._id,
        score: submission.score,
        feedback: submission.feedback,
        suggestionsToImprove: submission.suggestionsToImprove,
      },
    });
  } catch (error) {
    console.error("Error submitting quiz answers:", error);
    next(error);
  }
};

export const getQuizHistory = async (req, res, next) => {
  try {
    const { grade, subject, minScore, maxScore, from, to } = req.query;
    const userId = req.user.id;

    let query = { userId };

    // Date range filter
    if (from || to) {
      query.completedDate = {};
      if (from) query.completedDate.$gte = new Date(from);
      if (to) {
        // Set the 'to' date to the end of the day
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.completedDate.$lte = toDate;
      }
    }

    // Score filter
    if (minScore || maxScore) {
      query.score = {};
      if (minScore) query.score.$gte = parseInt(minScore);
      if (maxScore) query.score.$lte = parseInt(maxScore);
    }

    const submissions = await Submission.find(query)
      .populate("quizId", "grade subject totalQuestions maxScore difficulty")
      .sort({ completedDate: -1 })
      .lean();

    // Apply filters on populated quizId fields
    const filteredSubmissions = submissions.filter((sub) => {
      if (grade && sub.quizId.grade !== parseInt(grade)) return false;
      if (subject && sub.quizId.subject !== subject) return false;
      return true;
    });

    const formattedSubmissions = filteredSubmissions.map((sub) => ({
      id: sub._id,
      quizId: sub.quizId._id,
      grade: sub.quizId.grade,
      subject: sub.quizId.subject,
      score: sub.score,
      maxScore: sub.quizId.maxScore,
      difficulty: sub.quizId.difficulty,
      completedDate: sub.completedDate,
      isRetry: sub.isRetry,
      previousSubmissionId: sub.previousSubmissionId,
    }));

    res.status(200).json({
      message: "Quiz history retrieved successfully",
      submissions: formattedSubmissions,
    });
  } catch (error) {
    console.error("Error retrieving quiz history:", error);
    next(error);
  }
};

export const retryQuiz = async (req, res, next) => {
  try {
    const { quizId, answers } = req.body;
    const user = req.user;
    const userId = user._id;

    if (!quizId || !answers || !Array.isArray(answers)) {
      return next(errorHandler(400, "Invalid retry data"));
    }
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return next(errorHandler(404, "Quiz not found"));
    }

    // Fetch all questions for this quiz
    const questions = await Question.find({ _id: { $in: quiz.questions } });

    if (questions.length !== answers.length) {
      return next(
        errorHandler(
          400,
          "Number of answers does not match number of questions"
        )
      );
    }

    const previousSubmission = await Submission.findOne({
      userId,
      quizId,
    }).sort({ completedDate: -1 });

    if (!previousSubmission) {
      return next(
        errorHandler(404, "No previous submission found for this quiz")
      );
    }

    const evaluation = await evaluateQuizAnswers(
      questions,
      answers,
      quiz.maxScore
    );

    const newSubmission = new Submission({
      userId,
      quizId,
      answers: answers.map((answer, index) => ({
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
      })),
      score: evaluation.score,
      feedback: evaluation.feedback,
      suggestionsToImprove: evaluation.suggestionsToImprove,
      isRetry: true,
      previousSubmissionId: previousSubmission._id,
    });

    await newSubmission.save();

    try {
      await sendQuizResultEmail(user.email, {
        score: evaluation.score,
        maxScore: quiz.maxScore,
        feedback: evaluation.feedback,
        suggestionsToImprove: evaluation.suggestionsToImprove,
        isRetry: true,
        previousScore: previousSubmission.score,
      });
    } catch (error) {
      console.log(error);
    }

    res.status(200).json({
      message: "Quiz retried and evaluated successfully",
      submission: {
        id: newSubmission._id,
        score: newSubmission.score,
        previousScore: previousSubmission.score,
        feedback: newSubmission.feedback,
        suggestionsToImprove: newSubmission.suggestionsToImprove,
        isRetry: newSubmission.isRetry,
        previousSubmissionId: newSubmission.previousSubmissionId,
      },
    });
  } catch (error) {
    console.error("Error retrying quiz:", error);
    next(error);
  }
};

export const getQuestionHint = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    if (!questionId) {
      return next(errorHandler(400, "Question ID is required"));
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return next(errorHandler(404, "Question not found"));
    }

    if (!question.hint) {
      const reply = await getHint(question);
      question.hint = reply;
      await question.save();
    }

    res.status(200).json({
      message: "Hint retrieved successfully",
      hint: question.hint,
    });
  } catch (error) {
    console.error("Error retrieving question hint:", error);
    next(error);
  }
};

export const getQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    // Try to get the quiz from cache
    const cacheKey = `quiz:${quizId}`;
    const cachedQuiz = await getCache(cacheKey);
    if (cachedQuiz) {
      return res.status(200).json({
        message: "Quiz retrieved from cache",
        quiz: cachedQuiz,
      });
    }

    // If not in cache, fetch from database
    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) {
      next(errorHandler(404,"Quiz not found"));
    }

    const quizData = {
      id: quiz._id,
      grade: quiz.grade,
      subject: quiz.subject,
      totalQuestions: quiz.totalQuestions,
      maxScore: quiz.maxScore,
      difficulty: quiz.difficulty,
      questions: quiz.questions.map((q) => ({
        text: q.text,
        options: q.options,
      })),
    };

    // Cache the quiz data
    await setCache(cacheKey, quizData, 3600); // Cache for 1 hour

    res.status(200).json({
      message: "Quiz retrieved successfully",
      quiz: quizData,
    });
  } catch (error) {
    console.error("Error retrieving quiz:", error);
    next(error);
  }
};
