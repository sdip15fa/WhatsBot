import { sendLocalized } from "../helpers/localizedMessenger.js";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

const execute = async (client: Client, msg: Message) => {
  if (!msg.hasQuotedMsg) {
    return await sendLocalized(client, msg, "delete.no_quoted_msg");
  }

  const quote = await msg.getQuotedMessage();

  try {
    await quote.delete(true);
    await msg.delete(true);
  } catch {
    await sendLocalized(client, msg, "delete.error");
  }
};

const command: Command = {
  name: "Delete",
  description: "delete.description",
  command: "!delete",
  commandType: "plugin",
  isDependent: false,
  help: "delete.help",
  execute,
  public: false,
};

export default command;
