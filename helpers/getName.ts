import db from "../db";
import { wtsClient } from "../main";
import { Nickname } from "../models/nickname";

export async function getName(id: string) {
  try {
    const nickname = (
      (await db("nickname").coll.findOne({
        id,
      })) as Nickname | null
    )?.name;
    if (nickname) return nickname;
    const contact = await wtsClient.getContactById(id);
    if (contact.name) {
      return contact.name;
    }
    if (contact.number) {
      return contact.number;
    }
  } catch {}
  return id.split("@")[0];
}
