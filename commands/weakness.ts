import { Dex } from "pokemon-showdown";
import { Client, Message } from "whatsapp-web.js";
import { weakness } from "../helpers/weakness";

const execute = async (client: Client, msg: Message, args: string[]) => {
  if (!args[0]) {
    return await client.sendMessage(msg.to, "Please provide an argument.");
  }
  await client.sendMessage(msg.to, weakness(args[0]));
};

module.exports = {
  name: "Weakness",
  description: "Get pokemon weakness",
  command: "!weakness",
  commandType: "plugin",
  isDependent: false,
  help: `*Weakness*\n\nLookup a pokemon's weaknesses with this command.\n\n*!weakness [pokemon]*\nTo check a pokemon`,
  execute,
};
