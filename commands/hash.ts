//jshint esversion:6

import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";
import crypto from "crypto";

const execute = async (client: Client, msg: Message, args: string[]) => {
  if (args.length === 0) {
    await sendLocalized(client, msg, "hash.no_argument");
    return;
  }

  const algorithm = args[0].toLowerCase();
  const text = args.slice(1).join(" ");

  if (!text) {
    await sendLocalized(client, msg, "hash.no_text");
    return;
  }

  const supportedAlgorithms = ["md5", "sha1", "sha256", "sha512"];

  if (!supportedAlgorithms.includes(algorithm)) {
    await msg.reply(
      `❌ Unsupported algorithm. Supported: ${supportedAlgorithms.join(", ")}`
    );
    return;
  }

  try {
    const hash = crypto.createHash(algorithm).update(text).digest("hex");
    await msg.reply(`*${algorithm.toUpperCase()} Hash:*\n\n\`\`\`${hash}\`\`\``);
  } catch (error) {
    await sendLocalized(client, msg, "hash.error");
  }
};

const command: Command = {
  name: "Hash",
  description: "Generate hashes (MD5, SHA256, etc.)",
  command: "!hash",
  commandType: "plugin",
  isDependent: false,
  help: undefined,
  execute,
  public: true,
};

export default command;
