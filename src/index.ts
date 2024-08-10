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
    const maps = await mapsCollection.find().exec();

    const updatedMaps = maps.map((map) => ({
      ...map.toObject(),
      hello: "hello",
    }));

    res.send(updatedMaps);
  } catch (error) {
    console.error("Error fetching maps", error);
    throw error;
  }
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid player ID format" });
    }

    const player = await playersCollection.findById(id);

    if (!player) {
      return res.status(404).json({ message: "Player does not exist" });
    }

    const stats = await getPlayerStats(id);
    console.log(`Time spent playing: ${stats.timeSpentPlayingSeconds} seconds`);

    res.status(200).json({ player });
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid player ID format" });
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

    console.log(typeof id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid player ID format" });
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

    const findMap = await mapsCollection.findById(mapId);
    if (!findMap) {
      return res.status(400).json({ message: "Map does not exist" });
    }

    for (const id of players) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid player ID format" });
      }

      const findPlayer = await playersCollection.findById(id);
      console.log(findPlayer);
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
