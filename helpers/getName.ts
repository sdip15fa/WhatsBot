import db from "../db/index.js";
import { wtsClient } from "../main.js";
import { Nickname } from "../models/nickname.js";

export async function getName(id: string) {
  try {
    const nickname = (
      (await db("nickname").coll.findOne({
        id,
      })) as Nickname | null
    )?.name;
    const contact = await wtsClient.getContactById(id);
    if (contact.name) {
      return nickname ? `${nickname} (${contact.name})` : contact.name;
    }
    if (contact.number) {
      return nickname ? `${nickname} (${contact.number})` : contact.number;
    }
    return nickname ? `${nickname} (${id.split("@")[0]})` : id.split("@")[0];
  } catch {}
  return id.split("@")[0];
}
