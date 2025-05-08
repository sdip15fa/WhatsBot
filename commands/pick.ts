import { sendLocalized } from "../helpers/localizedMessenger.js";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

//jshint esversion:8
const execute = async (_client: Client, msg: Message, args: string[]) => {
  let options: string[];
  if (msg.hasQuotedMsg) {
    const quotedBody = (await msg.getQuotedMessage())?.body;
    options = quotedBody ? quotedBody.trim().split(/\s+/) : [];
  } else {
    options = args;
  }

  options = options
    .map((arg) => {
      return arg.replace(/^!+/, ""); // Remove only leading exclamation marks
    })
    .filter((opt) => opt.length > 0); // Filter out empty strings

  if (!options.length) {
    return sendLocalized(_client, msg, "pick.no_options");
  }
  msg.reply(options[Math.floor(Math.random() * options.length)]);
};

const command: Command = {
  name: "Pick", //name of the module
  description: "pick.description", // short description of what this command does
  command: "!pick", //command with prefix. Ex command: '!test'
  commandType: "plugin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "pick.help", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: true,
  execute,
};

export default command;
