import mongoose, {
  Schema,
  Document,
  ObjectId,
  Types,
  NumberSchemaDefinition,
} from "mongoose";

export interface IRound extends Document {
  mapId: Types.ObjectId;
  answer: String;
  latitude: Number;
  longitude: Number;
  streetView: String;
  attempt: Number;
  round: Number;
  players: Types.ObjectId[];
  startTime: Date;
  endTime: Date;
  score: Number;
  createdAt: Date;
  updatedAt: Date;
}

const roundSchema: Schema<IRound> = new Schema(
  {
    mapId: {
      type: Schema.Types.ObjectId,
      ref: "Map",
      required: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    streetView: {
      type: Number,
      required: true,
      match: [/^https?:\/\/[^\s/$.?#].[^\s]*$/, "Please enter a valid URL"],
      trim: true,
    },
    attempt: {
      type: Number,
      required: true,
      trim: true,
    },
    round: {
      type: Number,
      required: true,
      trim: true,
    },
    players: [
      {
        type: Schema.Types.ObjectId,
        ref: "Player",
        required: true,
      },
    ],
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now(),
    },
  },
  {
    collection: "rounds",
  }
);

const RoundModel = mongoose.model<IRound>("Round", roundSchema);
export default RoundModel;
