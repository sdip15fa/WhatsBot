//jshint esversion:8
import dictionary from "ud-api";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

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
    await sendLocalized(client, msg, "ud.error");
  } else if (typeof data !== "string") {
    await sendLocalized(client, msg, "ud.success", {
      term: args.join(" "),
      definition: data[0].definition,
      example: data[0].example,
    });
  }
};

const command: Command = {
  name: "Urban Dictionary",
  description: "Gets dictionary meanings of words",
  command: "!ud",
  commandType: "plugin",
  isDependent: false,
  help: "ud.help",
  execute,
  public: true,
};

export default command;
