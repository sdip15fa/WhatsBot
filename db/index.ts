import { MongoClient } from "mongodb";
import config from "../config.js";

export const client = new MongoClient(config.mongodb_url);

export default (collection: string) => {
  return {
    conn: client,
    coll: client.db("whatsbot").collection(collection),
  };
};
