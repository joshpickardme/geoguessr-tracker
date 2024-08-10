import mongoose, { Model } from "mongoose";
import MapModel, { IMap } from "../models/map"; // Adjust the import path as necessary

export default async function checkMapNameExists(name: string) {
  const mapsCollection: Model<IMap> = MapModel;
  const map = await mapsCollection.findOne({ name: name });
  console.log(map);
  return map;
}
