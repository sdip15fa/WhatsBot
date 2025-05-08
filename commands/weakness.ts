import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { weakness } from "../helpers/weakness.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  if (!args[0]) {
    return await sendLocalized(client, msg, "weakness.no_argument");
  }
  await sendLocalized(client, msg, "weakness.success", {
    weakness_text: weakness(args[0]),
  });
};

const command: Command = {
  name: "Weakness",
  description: "Get pokemon weakness",
  command: "!weakness",
  commandType: "plugin",
  isDependent: false,
  help: "weakness.help",
  execute,
  public: true,
};

export default command;
