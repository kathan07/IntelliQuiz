import express from 'express';
import verifyUser from '../utils/verifyUser.js';
import { generateQuiz, submitQuizAnswers, retryQuiz, getQuizHistory, getQuestionHint, getQuiz} from '../controllers/quiz.controller.js';
import rateLimit from "../utils/rateLimit.js"

const router = express.Router();


// Quiz routes
router.post('/generate', verifyUser, rateLimit, generateQuiz);
router.post('/submit', verifyUser, rateLimit, submitQuizAnswers);
router.get('/history', verifyUser, rateLimit, getQuizHistory);
router.post('/retry', verifyUser, rateLimit, retryQuiz);
router.get('/hint/:questionId',verifyUser, rateLimit, getQuestionHint);
router.get('/:quizId',verifyUser, rateLimit, getQuiz);

export default router;
