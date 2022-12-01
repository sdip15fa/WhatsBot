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
