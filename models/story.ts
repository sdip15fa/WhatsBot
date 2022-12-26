import { ObjectId } from "mongodb";

export default interface Story {
  _id?: ObjectId;
  chatId: string;
  createdAt: Date;
  lastModified: Date;
  story: string[];
}
