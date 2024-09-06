import express from "express";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser'
import auth from "./routes/auth.route.js";
import connectDB from "./db/db.js";


const app = express();
app.use(express.json());
app.use(cookieParser());
dotenv.config();

const port = process.env.PORT; 


connectDB();
app.use("/auth",auth);




app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})