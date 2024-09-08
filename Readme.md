# IntelliQuiz

Welcome to the IntelliQuiz project! This repository contains the backend code for an AI-powered quiz application that generates, evaluates, and provides hints based on user inputs. The project uses GROQ for intelligent quiz generation and evaluation, delivering a personalized learning experience for users.

For fast quiz retrieval and caching, Redis is employed to ensure efficient performance, particularly during frequent quiz fetches and evaluations. Additionally, NodeMailer is used to send users detailed quiz scores and performance reviews directly to their inbox, enhancing the feedback loop.

## Features

## Features of IntelliQuiz

- **AI-Powered Quiz Generation**: Uses **GROQ** for generating quizzes tailored to user inputs, providing a dynamic and personalized quiz experience.
  
- **Real-Time Quiz Evaluation**: Automatically evaluates submitted answers and provides instant feedback.

- **Hint Generation**: Offers intelligent hints to guide users toward the correct answers based on their quiz performance.

- **Performance Reviews via Email**: Utilizes **NodeMailer** to send detailed reports of quiz scores and performance reviews directly to the user’s email.

- **Fast Quiz Fetching with Redis**: Incorporates **Redis** for efficient caching and quick retrieval of quizzes, ensuring fast and seamless user experience.

- **Retry with Suggestions**: Users can retry quizzes with suggestions for improvement based on previous responses.

- **Scalable Backend**: Designed with a focus on performance and scalability, making it suitable for a variety of educational platforms and quiz-based applications.


## Installation

To get started with Monolitic, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kathan07/IntelliQuiz.git
   cd IntelliQuiz
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Setting Up Environment Variables

1. **Create a `.env` file** in the root directory of the project.
2. **Add the necessary environment variables** to the `.env` file. Here is an example of what the `.env` file might look like:
   ```env
    PORT = ..
    MONGO_URL = "mongodb+srv://.." 
    JWT_SECRET = ...
    API_KEY = "...."
    EMAIL_USER = "......@gmail.com"
    EMAIL_PASS = "....."
    REDIS_URL = "redis://....."
   ```

## Usage

Once the application is up and running, you can access it at `http://localhost:3000`. Use the provided API endpoints to interact with the application.

## API Documentation

For detailed information on the available API endpoints, refer to the [API Documentation](https://documenter.getpostman.com/view/27974052/2sAXjRWpde).

## Hosted Base Endpoint

`https://playpower-zjeu.onrender.com`
