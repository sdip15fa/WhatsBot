//jshint esversion:8
import dictionary from "urban-dictionary";
import { Client, Message } from "whatsapp-web.js";

async function ud(term: string) {
  try {
    return await dictionary.define(term);
  } catch (error) {
    return "error";
  }
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  let data = await ud(args.join(" "));
  if (data == "error") {
    await client.sendMessage(
      (await msg.getChat()).id._serialized,
      `🙇‍♂️ *Error*\n\n` +
        "```Something Unexpected Happened while Lookup on Urban Dictionary```"
    );
  } else if (typeof data !== "string") {
    await client.sendMessage(
      (await msg.getChat()).id._serialized,
      "*Term:* ```" +
        args.join(" ") +
        "```\n\n" +
        "*Definition:* ```" +
        data[0].definition +
        "```\n\n" +
        "*Example:* ```" +
        data[0].example +
        "```"
    );
  }
};

module.exports = {
  name: "Urban Dictionary",
  description: "Gets dictionary meanings of words",
  command: "!ud",
  commandType: "plugin",
  isDependent: false,
  help: `*Urban Dictionary*\n\nUrban Dictionary is a crowdsourced online dictionary for slang words and phrases.\n\n*!ud [Word]*\nto search a word using Urban Dictionary`,
  execute,
  public: true
};
