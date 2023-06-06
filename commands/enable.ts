import { Client, Message } from "whatsapp-web.js";
import db from "../db/index.js";

//jshint esversion:8
const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat())?.id._serialized;
  if (
    !(
      await db("chats").coll.updateOne(
        { chatId, disabled: true },
        { $set: { disabled: false } }
      )
    ).matchedCount
  ) {
    return await client.sendMessage(chatId, "Bot is not disabled.");
  }
  return client.sendMessage(chatId, "Bot enabled.");
};

export default {
  name: "Enable", //name of the module
  description: "Enable the bot in this chat", // short description of what this command does
  command: "!enable", //command with prefix. Ex command: '!test'
  commandType: "admin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "Type !enable in the chat to enable the bot", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: false,
  execute,
};
