import { Client, Message } from "whatsapp-web.js";
import { commands } from "../main";

//jshint esversion:8
const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  if (!args.length) {
    let adminHelp = "🔱 *Administration*\n\n";
    let infoHelp = "🔱 *Info*\n\n";
    let pluginHelp = "🔱 *Plugins*\n\n";
    commands.forEach((command: any) => {
      if (!command.isDependent) {
        if (command.commandType === "admin")
          adminHelp += `⭐ *${command.name} (${command.command})*  - ${
            command.description
          } (public: ${command.public ? "yes" : "no"})\n`;
        if (command.commandType === "info")
          infoHelp += `⭐ *${command.name} (${command.command})*  - ${
            command.description
          } (public: ${command.public ? "yes" : "no"})\n`;
        if (command.commandType === "plugin")
          pluginHelp += `⭐ *${command.name} (${command.command})*  - ${
            command.description
          } (public: ${command.public ? "yes" : "no"})\n`;
      }
    });
    let help = `Welcome to KK park!\n\n${adminHelp}\n${infoHelp}\n${pluginHelp}\n${
      commands.get("help").help
    }`;
    await client.sendMessage(chatId, help);
  } else if (commands.has(args[0])) {
    await client.sendMessage(
      chatId,
      `${commands.get(args[0]).help}\npublic: ${
        commands.get(args[0]).public ? "yes" : "no"
      }`
    );
  } else {
    await client.sendMessage(
      chatId,
      `No command with the name *${args[0]}*...`
    );
  }
};

module.exports = {
  name: "help",
  description: "get information about available commands",
  command: "!help",
  commandType: "info",
  isDependent: false,
  help: "To get more info use ```!help [command]```. Ex: ```!help ping```",
  execute,
  public: true,
};
