import { sendLocalized } from "../helpers/localizedMessenger.js";
//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import db from "../db/index.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  const userId = msg.fromMe ? process.env.WTS_OWNER_ID : msg.author || msg.from;
  const nickname = args.join(" ");
  if (!nickname) {
    return await sendLocalized(client, msg, "nick.no_nickname");
  }
  if (nickname.length > 20) {
    return await sendLocalized(client, msg, "nick.too_long");
  }
  if (
    !(
      await db("nickname").coll.updateOne(
        { id: userId },
        { $set: { name: nickname } },
      )
    ).matchedCount
  ) {
    await db("nickname").coll.insertOne({
      id: userId,
      name: nickname,
    });
  }
  return await sendLocalized(client, msg, "nick.success");
};

const command: Command = {
  name: "Nickname",
  description: "nick.description",
  command: "!nick",
  commandType: "plugin",
  isDependent: false,
  help: "nick.help",
  execute,
  public: true,
};

export default command;
