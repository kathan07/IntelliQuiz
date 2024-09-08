import express from 'express';
import verifyUser from '../utils/verifyUser.js';
import { generateQuiz, submitQuizAnswers, retryQuiz, getQuizHistory, getQuestionHint, getQuiz} from '../controllers/quiz.controller.js';


const router = express.Router();


// Quiz routes
router.post('/generate', verifyUser, generateQuiz);
router.post('/submit', verifyUser, submitQuizAnswers);
router.get('/history', verifyUser, getQuizHistory);
router.post('/retry', verifyUser, retryQuiz);
router.get('/hint/:questionId',verifyUser, getQuestionHint);
router.get('/:quizId',verifyUser, getQuiz);

export default router;
