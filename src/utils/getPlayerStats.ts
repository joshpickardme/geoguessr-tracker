import mongoose, { Model, Types } from "mongoose";

// Collections
import RoundModel, { IRound } from "../models/round"; // Adjust the import path as necessary

// Util
import getRoundDuration from "./getRoundDuration";

export default async function getPlayerStats(id: string) {
  let secondsSpent = 0;
  let minutesSpent = 0;
  let hoursSpent = 0;
  let totalScore = 0;
  let roundsPlayed = 0;
  let formattedTime = "";

  try {
    const rounds = await RoundModel.find({ players: id });
    for (const round of rounds) {
      roundsPlayed++;
      totalScore += round.score.valueOf();
      const roundDuration = getRoundDuration(
        round.startTime.valueOf(),
        round.endTime.valueOf()
      );
      secondsSpent += roundDuration;
    }
    minutesSpent = secondsSpent / 60;
    hoursSpent = minutesSpent / 60;
    return {
      time: {
        secondsSpent,
        minutesSpent,
        hoursSpent,
        formattedTime,
      },
      other: {
        totalScore,
        roundsPlayed,
      },
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
