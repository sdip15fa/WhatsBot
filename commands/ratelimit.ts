import { Client, Message } from "whatsapp-web.js";
import db from "../db/index.js";

//jshint esversion:8
const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat())?.id._serialized;
  if (!args[0]) {
    return client.sendMessage(
      chatId,
      `Rate limit is ${
        (await db("chats").coll.findOne({ chatId }))?.ratelimit ?? true
          ? "enabled"
          : "disabled"
      }.`
    );
  }
  if (!["true", "false"].includes(args[0])) {
    return client.sendMessage(chatId, "Only true or false is accepted.");
  }
  if (
    !(
      await db("chats").coll.updateOne(
        { chatId },
        { $set: { ratelimit: JSON.parse(args[0]) } }
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
    `Rate limit changed to ${JSON.parse(args[0])}.`
  );
};

export default {
  name: "Rate limit", //name of the module
  description: "Enable / disable rate limit.", // short description of what this command does
  command: "!ratelimit", //command with prefix. Ex command: '!test'
  commandType: "admin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "!ratelimit [true|false]", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: false,
  execute,
};
