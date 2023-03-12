//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import db from "../db/index.js";

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;

  await db("gpt").coll.deleteOne({ id: chatId });

  await client.sendMessage(chatId, "Chatgpt context cleared.");
};

export default {
  name: "cleargpt",
  description: "Clear chatgpt context",
  command: "!cleargpt",
  commandType: "plugin",
  isDependent: false,
  help: `*Cleargpt*\n\nClear chatgpt context\n\n!cleargpt`,
  execute,
  public: true,
};
