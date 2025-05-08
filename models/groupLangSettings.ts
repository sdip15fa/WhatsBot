import { ObjectId } from "mongodb";

export interface IGroupLangSetting {
  _id?: ObjectId;
  groupId: string;
  targetLanguage: "yue" | "en" | "ja";
  createdAt?: Date;
  updatedAt?: Date;
}
