import { ObjectId } from "mongodb";

export interface Permit {
  _id?: ObjectId;
  found: boolean;
  permit: boolean;
  times: number;
}
