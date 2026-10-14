import mongoose from "mongoose";

// Single shared connection for the API process.
export async function connectDB(uri) {
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Set it in .env");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
