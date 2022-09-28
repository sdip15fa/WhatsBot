import { MongoClient } from "mongodb";
import config from "../config";

export default async (collection: string) => {
  const conn = await MongoClient.connect(config.mongodb_url);
  return {
    conn,
    coll: conn.db("whatsbot").collection(collection),
  };
};
