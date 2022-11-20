import { ObjectId } from "mongodb";

export interface Media {
    _id?: ObjectId;
    orgId: string;
    fwdId: string;
}