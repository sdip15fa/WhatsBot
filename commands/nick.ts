//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import db from "../db";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  const userId = msg.fromMe ? process.env.WTS_OWNER_ID : (msg.author || msg.from);
  const nickname = args.join(" ");
  if (!nickname) {
    return await client.sendMessage(chatId, "Please enter a nickname!");
  }
  if (
    !(
      await db("nickname").coll.updateOne(
        { id: userId },
        { $set: { name: nickname } }
      )
    ).matchedCount
  ) {
    await db("nickname").coll.insertOne({
      id: userId,
      name: nickname,
    });
  }
  return await client.sendMessage(chatId, "Nickname set!");
};

module.exports = {
  name: "Nickname",
  description: "Set your nickname.",
  command: "!nick",
  commandType: "plugin",
  isDependent: false,
  help: `*Set your nickname for use in count and other occasions.*\n\n*!nick [your nickname]*`,
  execute,
  public: true,
};
