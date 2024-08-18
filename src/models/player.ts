import mongoose, { Schema, Document, ObjectId, Types } from "mongoose";

export interface IPlayer extends Document {
  name: String;
  stats?: {
    time?: {
      secondsSpent: Number;
      minutesSpent: Number;
      hoursSpent: Number;
      formattedTime: String;
    };
    totalScore: Number;
    roundsPlayed: Number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const playerSchema: Schema<IPlayer> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    collection: "players",
  }
);

const PlayerModel = mongoose.model<IPlayer>("Player", playerSchema);
export default PlayerModel;
