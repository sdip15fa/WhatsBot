import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { weakness } from "../helpers/weakness.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  if (!args[0]) {
    return await client.sendMessage(chatId, "Please provide an argument.");
  }
  await client.sendMessage(chatId, weakness(args[0]));
};

const command: Command = {
  name: "Weakness",
  description: "Get pokemon weakness",
  command: "!weakness",
  commandType: "plugin",
  isDependent: false,
  help: `*Weakness*\n\nLookup a pokemon's weaknesses with this command.\n\n*!weakness [pokemon]*\nTo check a pokemon`,
  execute,
  public: true,
};

export default command;
