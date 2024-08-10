import mongoose, { Schema, Document, ObjectId, Types } from "mongoose";

export interface IMap extends Document {
  name: String;
  category: String;
  rounds: Types.ObjectId[];
  players: Types.ObjectId[];
  complete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mapSchema: Schema<IMap> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    rounds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Round",
        required: false,
      },
    ],
    players: [
      {
        type: Schema.Types.ObjectId,
        ref: "Player",
        required: false,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now, // This provides a default value for 'createdAt'
      required: true, // This ensures the 'createdAt' field is mandatory
    },
  },
  {
    collection: "maps",
  }
);

const MapModel = mongoose.model<IMap>("Map", mapSchema);
export default MapModel;
