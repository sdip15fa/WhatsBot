import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import db from "../db/index.js";

//jshint esversion:8
const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat())?.id._serialized;
  if (!args[0]) {
    const targetLang = await getGroupLanguage(msg);
    const isEnabled =
      (await db("chats").coll.findOne({ chatId }))?.ratelimit ?? true;
    return sendLocalized(client, msg, "ratelimit.status", {
      status: isEnabled
        ? getString("enabled", targetLang)
        : getString("disabled", targetLang),
    });
  }
  if (!["true", "false"].includes(args[0])) {
    return sendLocalized(client, msg, "ratelimit.invalid_argument");
  }
  if (
    !(
      await db("chats").coll.updateOne(
        { chatId },
        { $set: { ratelimit: JSON.parse(args[0]) } },
      )
    ).matchedCount
  ) {
    await db("chats").coll.insertOne({
      chatId,
      ratelimit: JSON.parse(args[0]),
    });
  }
  return client.sendMessage(
    chatId,
    getString("ratelimit.changed", await getGroupLanguage(msg), {
      status: JSON.parse(args[0])
        ? getString("enabled", await getGroupLanguage(msg))
        : getString("disabled", await getGroupLanguage(msg)),
    }),
  );
};

const command: Command = {
  name: "Rate limit", //name of the module
  description: "ratelimit.description", // short description of what this command does
  command: "!ratelimit", //command with prefix. Ex command: '!test'
  commandType: "admin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "ratelimit.help", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: false,
  execute,
};

export default command;
