import { sendLocalized } from "../helpers/localizedMessenger.js";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import db from "../db/index.js";

//jshint esversion:8
const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat())?.id._serialized;
  if (
    !(
      await db("chats").coll.updateOne(
        { chatId, disabled: true },
        { $set: { disabled: false } },
      )
    ).matchedCount
  ) {
    return await sendLocalized(client, msg, "enable.not_disabled");
  }
  return sendLocalized(client, msg, "enable.success");
};

const command: Command = {
  name: "Enable", //name of the module
  description: "enable.description", // short description of what this command does
  command: "!enable", //command with prefix. Ex command: '!test'
  commandType: "admin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "enable.help", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: false,
  execute,
};

export default command;
