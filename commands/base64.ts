//jshint esversion:6

import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  if (args.length === 0) {
    await sendLocalized(client, msg, "base64.no_argument");
    return;
  }

  const subCommand = args[0].toLowerCase();

  if (subCommand === "encode" || subCommand === "e") {
    const text = args.slice(1).join(" ");

    if (!text) {
      await sendLocalized(client, msg, "base64.encode.no_text");
      return;
    }

    try {
      const encoded = Buffer.from(text, "utf-8").toString("base64");
      await msg.reply(`*Base64 Encoded:*\n\n\`\`\`${encoded}\`\`\``);
    } catch (error) {
      await sendLocalized(client, msg, "base64.encode.error");
    }
    return;
  }

  if (subCommand === "decode" || subCommand === "d") {
    const text = args.slice(1).join(" ");

    if (!text) {
      await sendLocalized(client, msg, "base64.decode.no_text");
      return;
    }

    try {
      const decoded = Buffer.from(text, "base64").toString("utf-8");
      await msg.reply(`*Base64 Decoded:*\n\n\`\`\`${decoded}\`\`\``);
    } catch (error) {
      await sendLocalized(client, msg, "base64.decode.error");
    }
    return;
  }

  await sendLocalized(client, msg, "base64.invalid_command");
};

const command: Command = {
  name: "Base64",
  description: "Encode/decode base64 text",
  command: "!base64",
  commandType: "plugin",
  isDependent: false,
  help: undefined,
  execute,
  public: true,
};

export default command;
