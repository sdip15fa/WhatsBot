import { ObjectId } from "mongodb";

export default interface Covid {
  _id?: ObjectId;
  date: string;
  chatId: string;
  status: CovidStatus[];
}

export interface CovidStatus {
  id: string;
  name: string;
  time: string;
  rat: "positive" | "negative";
  temperature: number;
  symptoms?: string;
}
