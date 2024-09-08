import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  port: 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendQuizResultEmail = async (userEmail, quizResult) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: quizResult.isRetry
      ? "Your Quiz Retry Results"
      : "Your Quiz Results",
    html: `
        <h1>${quizResult.isRetry ? "Quiz Retry Results" : "Quiz Results"}</h1>
        <p>Score: ${quizResult.score} / ${quizResult.maxScore}</p>
        ${
          quizResult.isRetry
            ? `<p>Previous Score: ${quizResult.previousScore} / ${quizResult.maxScore}</p>`
            : ""
        }
        <h2>Feedback:</h2>
        <ul>
          ${quizResult.feedback.map((item) => `<li>${item}</li>`).join("")}
        </ul>
        <h2>Suggestions to Improve:</h2>
        <ul>
          ${quizResult.suggestionsToImprove
            .map((item) => `<li>${item}</li>`)
            .join("")}
        </ul>
      `,
  };

  await transporter.sendMail(mailOptions);
};

export default sendQuizResultEmail;
