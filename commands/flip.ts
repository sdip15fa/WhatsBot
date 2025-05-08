import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

//jshint esversion:8
const execute = async (_client: Client, msg: Message) => {
  const targetLang = await getGroupLanguage(msg);
  const result =
    Math.random() < 0.5
      ? getString("flip.heads", targetLang)
      : getString("flip.tails", targetLang);
  msg.reply(result);
};

const command: Command = {
  name: "Flip", //name of the module
  description: "flip.description", // short description of what this command does
  command: "!flip", //command with prefix. Ex command: '!test'
  commandType: "plugin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "flip.help", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: true,
  execute,
};

export default command;
