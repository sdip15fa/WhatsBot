//jshint esversion:8
import dictionary from "ud-api";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

async function ud(term: string) {
  try {
    return await dictionary.define(term);
  } catch (error) {
    return "error";
  }
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  const data = await ud(args.join(" "));
  if (data == "error") {
    await client.sendMessage(
      chatId,
      `🙇‍♂️ *Error*\n\n` +
        "```Something Unexpected Happened while Lookup on Urban Dictionary```",
    );
  } else if (typeof data !== "string") {
    await client.sendMessage(
      chatId,
      "*Term:* ```" +
        args.join(" ") +
        "```\n\n" +
        "*Definition:* ```" +
        data[0].definition +
        "```\n\n" +
        "*Example:* ```" +
        data[0].example +
        "```",
    );
  }
};

const command: Command = {
  name: "Urban Dictionary",
  description: "Gets dictionary meanings of words",
  command: "!ud",
  commandType: "plugin",
  isDependent: false,
  help: `*Urban Dictionary*\n\nUrban Dictionary is a crowdsourced online dictionary for slang words and phrases.\n\n*!ud [Word]*\nto search a word using Urban Dictionary`,
  execute,
  public: true,
};

export default command;
