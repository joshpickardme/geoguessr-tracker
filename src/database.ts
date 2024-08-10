import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const url: string = process.env.MONGODB_URI!;

export async function connectToDatabase() {
  try {
    await mongoose.connect(url, {
      dbName: "geoguessr",
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    throw error;
  }
}
