import { ObjectId } from "mongodb";

export interface Nickname {
  _id?: ObjectId;
  // user id serialized
  id: string;
  // custom name
  name: string;
}
