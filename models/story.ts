import { ObjectId } from "mongodb";

export default interface Story {
  _id?: ObjectId;
  id: number;
  chatId: string;
  createdAt: Date;
  lastModified: Date;
  story: string[];
  current: boolean;
}
