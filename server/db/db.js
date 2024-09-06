import mongoose from "mongoose";

const connectDB = async () => {
  const mongo = process.env.MONGO_URL;
  try {
    await mongoose.connect(mongo, {});
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

export default connectDB;