import { Request, Response } from "express";
import { connectToDatabase } from "./database";
import mongoose, { Model } from "mongoose";

// Models
import MapModel, { IMap } from "./models/map";
import PlayerModel, { IPlayer } from "./models/player";
import RoundModel, { IRound } from "./models/round";

// Utils
import checkMapNameExists from "./utils/checkMapNameExists";
import getPlayerStats from "./utils/getPlayerStats";
import validateObjectIds from "./utils/validateObjectIds";

// Collections
const mapsCollection: Model<IMap> = MapModel;
const playersCollection: Model<IPlayer> = PlayerModel;
const roundsCollection: Model<IRound> = RoundModel;

const express = require("express");
const app = express();
const port = 8080;

app.use(express.json());

connectToDatabase()
  .then(() => {
    // Start Express server after successful DB connection
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database", error);
    process.exit(1);
  });

app.get("/api/ping", (req: Request, res: Response) => {
  res.send("pong");
});

app.get("/api/maps2", async (req: Request, res: Response) => {
  try {
    const maps = await mapsCollection.find().exec();

    for (const map of maps) {
      const rounds = await roundsCollection.find({ mapId: map.id });
      console.log(rounds);
    }
    res.send("suc");
  } catch (error) {
    console.error("Error fetching maps", error);
    throw error;
  }
});

// Returns all maps
app.get("/api/maps", async (req: Request, res: Response) => {
  try {
    // Fetch all rounds grouped by mapId
    const roundsByMapId = await roundsCollection
      .aggregate([
        {
          $group: {
            _id: "$mapId",
            rounds: { $push: "$$ROOT" }, // Push entire round document into rounds array
          },
        },
      ])
      .exec();

    // Create a map from mapId to its rounds for easy lookup
    const roundsMap = roundsByMapId.reduce((acc: any, roundGroup: any) => {
      acc[roundGroup._id.toString()] = roundGroup.rounds;
      return acc;
    }, {});

    // Fetch all maps from the mapsCollection
    const allMaps = await mapsCollection.find().exec();

    // Attach rounds to their respective maps
    const mapsWithRounds = allMaps.map((map: any) => {
      const rounds = roundsMap[map._id.toString()] || []; // Attach rounds or an empty array if none
      return {
        ...map._doc, // spread map document
        rounds, // attach the associated rounds
      };
    });

    // Return all maps with their associated rounds
    res.json(mapsWithRounds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/map/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  const validateIds = validateObjectIds([id]);

  if (validateIds.failed) {
    return res
      .status(400)
      .json({ message: "Invalid ObjectID", id: validateIds.failedId });
  }

  const map = await mapsCollection.findById(id);

  res.status(200).json(map);
});

app.post("/api/map", async (req: Request, res: Response) => {
  try {
    const { name, category, rounds, players, complete } = req.body;
    const mapExists = await checkMapNameExists(name);

    if (mapExists) {
      return res.status(409).json({
        message: "Map already exists in the database",
        map: mapExists,
      });
    }

    const newMap = new MapModel({
      name,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save the new document to the database
    const savedMap = await newMap.save();

    // Send the saved document back as the response
    res.status(201).json(savedMap);
  } catch (error) {
    console.error("Error creating map", error);
    res.status(500).json({ message: "Error creating map" });
  }
});

app.post("/api/maps", async (req: Request, res: Response) => {
  const maps = req.body;
  try {
    const newMaps = await mapsCollection.insertMany(maps);
    res.send(newMaps);
  } catch (error) {
    console.error(error);
    throw error;
  }
});

// Returns a random uncomplete map.
app.get("/api/randomMap", async (req: Request, res: Response) => {
  try {
    const mapsWithRounds = await roundsCollection.distinct("mapId");

    // Fetch maps that do not have associated rounds
    const mapsWithoutRounds = await mapsCollection
      .find({
        _id: { $nin: mapsWithRounds }, // Exclude maps with rounds
      })
      .exec();

    if (mapsWithoutRounds.length === 0) {
      return res.status(404).json({ message: "No incomplete maps available" });
    }

    // Pick a random map from the filtered list
    const randomMap =
      mapsWithoutRounds[Math.floor(Math.random() * mapsWithoutRounds.length)];

    // Return the random map
    res.json(randomMap);
  } catch (error) {
    console.error(error);
    throw error;
  }
});

app.get("/api/players", async (req: Request, res: Response) => {
  try {
    const players = await playersCollection.find().exec();
    res.status(200).json({ players });
  } catch (error) {
    console.error("Error fetching players", error);
    throw error;
  }
});

app.get("/api/player/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const validateIds = validateObjectIds([id]);

    if (validateIds.failed) {
      return res
        .status(400)
        .json({ message: "Invalid ObjectID", id: validateIds.failedId });
    }

    const player = await playersCollection.findById(id);

    if (!player) {
      return res.status(404).json({ message: "Player does not exist" });
    }

    const stats = await getPlayerStats(id);
    const playerObject = player.toObject();
    playerObject.stats = stats.other;
    playerObject.stats.time = stats.time;

    res.status(200).json({ player: playerObject });
  } catch (error) {
    console.error("Error fetching player", error);
    throw error;
  }
});

app.post("/api/player", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const player = await playersCollection.findOne({ name: name });
    if (player) {
      return res.json({
        message: `Player with the name '${name}' already exists`,
      });
    }

    const newPlayer = new PlayerModel({
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const savedPlayer = await newPlayer.save();

    res.status(201).json(savedPlayer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating player" });
  }
});

app.delete("/api/player/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const validateIds = validateObjectIds([id]);

    if (validateIds.failed) {
      return res
        .status(400)
        .json({ message: "Invalid ObjectID", id: validateIds.failedId });
    }

    const player = await playersCollection.findById(id);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    await playersCollection.findByIdAndDelete(id);

    res.json({ message: `Player: ${player.name} deleted successfully` });
  } catch (error) {
    console.error(error);
    res.json({ message: "Failed to delete player" });
  }
});

app.put("/api/player/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Invalid body format" });
    }

    const validateIds = validateObjectIds([id]);

    if (validateIds.failed) {
      return res
        .status(400)
        .json({ message: "Invalid ObjectID", id: validateIds.failedId });
    }

    const player = await playersCollection.findById(id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    await playersCollection.findByIdAndUpdate(id, { name: name });
    res.status(200).json({
      message: `Updated player successfully`,
      old_name: player.name,
      new_name: name,
    });
  } catch (error) {
    console.error(error);
    res.json({ message: `Failed to update player` });
  }
});

app.get("/api/rounds", async (req: Request, res: Response) => {
  try {
    const rounds = await roundsCollection.find().exec();
    res.status(200).send(rounds);
  } catch (error) {
    console.error(error);
    throw error;
  }
});

app.get("/api/round/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const validateIds = validateObjectIds([id]);

    if (validateIds.failed) {
      return res
        .status(400)
        .json({ message: "Invalid ObjectID", id: validateIds.failedId });
    }

    const round = await roundsCollection.findById(id);
    res.status(200).send(round);
  } catch (error) {
    console.error(error);
    throw error;
  }
});

app.post("/api/round", async (req: Request, res: Response) => {
  try {
    const {
      mapId,
      answer,
      latitude,
      longitude,
      streetView,
      attempt,
      round,
      players,
      startTime,
      endTime,
      score,
    } = req.body;

    const validateIds = validateObjectIds([mapId, ...players]);

    if (validateIds.failed) {
      return res
        .status(400)
        .json({ message: "Invalid ObjectID", id: validateIds.failedId });
    }

    const findMap = await mapsCollection.findById(mapId);
    if (!findMap) {
      return res.status(400).json({ message: "Map does not exist" });
    }

    for (const id of players) {
      const findPlayer = await playersCollection.findById(id);
      if (!findPlayer) {
        return res
          .status(400)
          .json({ message: "Player does not exist", player: id });
      }
    }

    const newRound = new RoundModel({
      mapId,
      answer,
      latitude,
      longitude,
      streetView,
      attempt,
      round,
      players,
      startTime,
      endTime,
      score,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const savedRound = await newRound.save();

    res.status(201).json({ savedRound });
  } catch (error) {
    console.error(error);
    throw error;
  }
});
