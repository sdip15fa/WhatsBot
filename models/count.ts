import { ObjectId } from "mongodb";

export interface Count {
  _id?: ObjectId;
  groupId: string;
  date: string;
  count: number;
  words?: number;
  users?: { id: string; name: string; count: number; words?: number }[];
}
