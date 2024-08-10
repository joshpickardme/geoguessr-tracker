import mongoose, { Model, Types } from "mongoose";

// Collections
import RoundModel, { IRound } from "../models/round"; // Adjust the import path as necessary

// Util
import getRoundDuration from "./getRoundDuration";

export default async function getPlayerStats(id: string) {
  let timeSpentPlayingSeconds = 0;

  try {
    const rounds = await RoundModel.find({ players: id });
    for (const round of rounds) {
      const roundDuration = getRoundDuration(
        round.startTime.valueOf(),
        round.endTime.valueOf()
      );
      timeSpentPlayingSeconds += roundDuration;
    }
    return {
      timeSpentPlayingSeconds,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
