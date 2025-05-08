//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import db from "../db/index.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  let chatId = args[0];
  if (!chatId) {
    chatId = (await msg.getChat()).id._serialized;
  }
  try {
    await client.getChatById(chatId);
  } catch {
    await sendLocalized(client, msg, "autoreply.chat_not_found", { chatId });
    return;
  }

  const curr = (await db("chats").coll.findOne({ chatId }))?.autoreply;
  await db("chats").coll.updateOne(
    { chatId },
    { $set: { autoreply: !curr } },
    { upsert: true },
  );
  await sendLocalized(client, msg, "autoreply.success", {
    status: !curr ? "enabled" : "disabled",
    chatId,
  });
};

const command: Command = {
  name: "autoreply.name",
  description: "autoreply.description",
  command: "!autoreply",
  commandType: "plugin",
  isDependent: false,
  help: "autoreply.help",
  execute,
  public: false,
};

export default command;
