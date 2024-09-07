import errorHandler from "../utils/error.js";
import Quiz from "../models/quiz.model.js";
import Question from "../models/question.model.js";
import Submission from "../models/submission.model.js";
import { Groq } from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();
// import nodemailer from "nodemailer";

const groq = new Groq({ apiKey: process.env.API_KEY });

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
    const { quizId, userId, answers } = req.body;

    if (!quizId || !userId || !answers || !Array.isArray(answers)) {
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
    const { userId, grade, subject, minScore, maxScore, from, to } = req.query;

    if (!userId) {
      next(errorHandler(400, "User ID is required"));
    }

    let query = { userId };

    // Apply filters
    if (grade) query["quiz.grade"] = parseInt(grade);
    if (subject) query["quiz.subject"] = subject;
    if (minScore) query.score = { $gte: parseInt(minScore) };
    if (maxScore) query.score = { ...query.score, $lte: parseInt(maxScore) };

    // Date range filter
    if (from || to) {
      query.completedDate = {};
      if (from) query.completedDate.$gte = new Date(from);
      if (to) query.completedDate.$lte = new Date(to);
    }

    const submissions = await Submission.find(query)
      .populate("quizId", "grade subject totalQuestions maxScore difficulty")
      .sort({ completedDate: -1 })
      .lean();

    const formattedSubmissions = submissions.map((sub) => ({
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
    const { userId, quizId, answers } = req.body;

    if (!userId || !quizId || !answers || !Array.isArray(answers)) {
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
      // Generate a hint using AI if not already available
      const prompt = `Generate a helpful hint for the following question without giving away the answer: "${question.text}"`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "mixtral-8x7b-32768",
      });

      question.hint = completion.choices[0].message.content;
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
