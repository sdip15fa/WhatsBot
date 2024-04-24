import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import db from "../db/index.js";

//jshint esversion:8
const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat())?.id._serialized;
  if (args[0] && args[0] !== "enable" && args[0] !== "disable") {
    return client.sendMessage(
      chatId,
      "Invalid option. Valid options are `enable` and `disable`.",
    );
  }

  const enable = args[0]
    ? args[0] === "enable"
    : !!(await db("chats").coll.findOne({
        chatId,
        suicide: false,
      }));

  await db("chats").coll.updateOne({ chatId }, { $set: { suicide: enable } });

  await client.sendMessage(
    chatId,
    `Suicide warning ${enable ? "enabled" : "disabled"}.`,
  );
};

const command: Command = {
  name: "Suicide", //name of the module
  description: "Enable/disable suicide warning.", // short description of what this command does
  command: "!suicide", //command with prefix. Ex command: '!test'
  commandType: "admin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "!suicide enable\n!suicide disable", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: false,
  execute,
};

export default command;
