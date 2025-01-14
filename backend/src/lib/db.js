import mongoose from "mongoose";
import colors from "colors";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected : ${conn.connection.host}`.bgMagenta.white);
  } catch (error) {
    console.log("MongoDB connection error:", error.bgRed.white);
  }
};
