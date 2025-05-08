import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
//jshint esversion:8
import natoPad from "nato-pad";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());

  if (!args.length && !quotedMsg.body) {
    return sendLocalized(client, msg, "nato.no_text");
  }

  const text = args.join(" ") || quotedMsg.body;

  if (text.length > 50) {
    return sendLocalized(client, msg, "nato.text_too_long");
  }

  await client.sendMessage(
    chatId,
    getString("nato.response", await getGroupLanguage(msg), {
      text: natoPad(args.join(" ") || quotedMsg.body),
    }),
  );
};

const command: Command = {
  name: "Nato",
  description: "nato.description",
  command: "!nato",
  commandType: "plugin",
  isDependent: false,
  help: "nato.help",
  execute,
  public: true,
};

export default command;
