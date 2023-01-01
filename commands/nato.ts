//jshint esversion:8
import natoPad from "nato-pad";
import { Client, Message } from "whatsapp-web.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  const quotedMsg = msg.hasQuotedMsg && await msg.getQuotedMessage();

  if (!args.length && !quotedMsg.body) {
    return client.sendMessage(
      chatId,
      "Please provide text to transform!"
    );
  }

  await client.sendMessage(chatId, natoPad(args.join(" ") || quotedMsg.body));
};

module.exports = {
  name: "Nato",
  description: "Transform text to nato alphabets",
  command: "!nato",
  commandType: "plugin",
  isDependent: false,
  help: `*Nato*\n\nTransform text to nato alphabets\n\n!nato [text]`,
  execute,
  public: true,
};