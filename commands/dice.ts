import { Client, Message } from "whatsapp-web.js";

//jshint esversion:8
const execute = async (_client: Client, msg: Message) => {
  msg.reply(String(Math.ceil(Math.random() * 6)));
};

export default {
  name: "Dice", //name of the module
  description: "Roll a dice", // short description of what this command does
  command: "!dice", //command with prefix. Ex command: '!test'
  commandType: "plugin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "Roll a (fair) dice\n\n!dice", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: true,
  execute,
};
