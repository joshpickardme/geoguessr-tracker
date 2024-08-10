import { Request, Response } from "express";
import { connectToDatabase } from "./database";

// Models
import mongoose, { Model } from "mongoose";
import MapModel, { IMap } from "./models/map"; // Adjust the import path as necessary
import PlayerModel, { IPlayer } from "./models/player";

// Utils
import checkMapNameExists from "./utils/checkMapNameExists";

// Collections
const playersCollection: Model<IPlayer> = PlayerModel;

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

// Returns all maps
app.get("/api/maps", async (req: Request, res: Response) => {
  try {
    const mapsCollection: Model<IMap> = MapModel;

    // Fetch documents
    const maps = await mapsCollection.find().exec();

    res.send(maps);
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
      rounds: rounds || [],
      players: players || [],
      complete: complete || false,
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
    res.status(200).json({ players: players });
  } catch (error) {
    console.error(`Failed to find players: ${error}`);
    res.status(500).json({ message: "Failed to find players" });
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
