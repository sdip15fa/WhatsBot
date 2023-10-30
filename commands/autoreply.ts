//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import db from "../db/index.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  let chatId = args[0];
  if (!chatId) {
    chatId = (await msg.getChat()).id._serialized;
  }
  if (
    !(async () => {
      try {
        await client.getChatById(chatId);
        return true;
      } catch {
        msg.reply(`Chat ${chatId} not found`).catch(() => {});
        return false;
      }
    })()
  ) {
    return;
  }
  const curr = (await db("chats").coll.findOne({ chatId }))?.autoreply;
  await db("chats").coll.updateOne(
    { chatId },
    { $set: { autoreply: !curr } },
    { upsert: true }
  );
  await client.sendMessage(
    (
      await msg.getChat()
    ).id._serialized,
    `Autoreply set for ${chatId}.`
  );
};

export default {
  name: "Autoreply",
  description: "Set a chat to autoreply",
  command: "!autoreply",
  commandType: "plugin",
  isDependent: false,
  help: `!autoreply [chatId]`,
  execute,
  public: false,
};
