import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
import { Client, Message } from "whatsapp-web.js";
import { commands } from "./index.js";
import { Command } from "../types/command.js";

//jshint esversion:8
const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  const targetLang = await getGroupLanguage(msg);
  if (!args.length) {
    let adminHelp = `🔱 *${getString("help.category.admin", targetLang)}*\n\n`;
    let infoHelp = `🔱 *${getString("help.category.info", targetLang)}*\n\n`;
    let pluginHelp = `🔱 *${getString(
      "help.category.plugins",
      targetLang,
    )}*\n\n`;
    commands.forEach((command: Command) => {
      if (!command.isDependent) {
        const description = getString(command.description, targetLang);
        const isPublic = command.public
          ? getString("help.public.yes", targetLang)
          : getString("help.public.no", targetLang);
        if (command.commandType === "admin")
          adminHelp += `⭐ *${getString(command.name, targetLang)} (${
            command.command
          })*  - ${description} (${getString(
            "help.public_label",
            targetLang,
          )}: ${isPublic})\n`;
        if (command.commandType === "info")
          infoHelp += `⭐ *${command.name} (${
            command.command
          })*  - ${description} (${getString(
            "help.public_label",
            targetLang,
          )}: ${isPublic})\n`;
        if (command.commandType === "plugin")
          pluginHelp += `⭐ *${getString(command.name, targetLang)} (${
            command.command
          })*  - ${description} (${getString(
            "help.public_label",
            targetLang,
          )}: ${isPublic})\n`;
      }
    });
    const help = `${getString(
      "help.welcome",
      targetLang,
    )}\n\n${adminHelp}\n${infoHelp}\n${pluginHelp}\n${getString(
      commands.get("help").help,
      targetLang,
    )}`;
    await client.sendMessage(chatId, help);
  } else if (commands.has(args[0])) {
    const command = commands.get(args[0]);
    const helpText = getString(command.help, targetLang);
    const isPublic = command.public
      ? getString("help.public.yes", targetLang)
      : getString("help.public.no", targetLang);
    await client.sendMessage(
      chatId,
      `${helpText}\n\n${getString(
        "help.public_label",
        targetLang,
      )}: ${isPublic}`,
    );
  } else {
    await client.sendMessage(
      chatId,
      getString("help.command_not_found", targetLang, { command: args[0] }),
    );
  }
};

const command: Command = {
  name: "help",
  description: "help.description",
  command: "!help",
  commandType: "info",
  isDependent: false,
  help: "help.help",
  execute,
  public: true,
};

export default command;
