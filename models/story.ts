import { ObjectId } from "mongodb";

export default interface Story {
    _id?: ObjectId,
    chatId: string,
    story: string[]
}