import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import db from "../db/index.js";

//jshint esversion:8
const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat())?.id._serialized;
  if (
    !(
      await db("chats").coll.updateOne(
        { chatId, disabled: { $ne: true } },
        { $set: { disabled: true } },
      )
    ).matchedCount
  ) {
    await db("chats").coll.insertOne({ chatId, disabled: true });
  }
  return client.sendMessage(chatId, "Bot disabled.");
};

const command: Command = {
  name: "Disable", //name of the module
  description: "Disable the bot in this chat", // short description of what this command does
  command: "!disable", //command with prefix. Ex command: '!test'
  commandType: "admin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "Type !disable in the chat to disable the bot", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: false,
  execute,
};

export default command;
