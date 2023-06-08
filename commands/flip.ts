import { Client, Message } from "whatsapp-web.js";

//jshint esversion:8
const execute = async (_client: Client, msg: Message) => {
  msg.reply(Math.random() < 0.5 ? "Heads" : "Tails");
};

export default {
  name: "Flip", //name of the module
  description: "Flip a coin", // short description of what this command does
  command: "!flip", //command with prefix. Ex command: '!test'
  commandType: "plugin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "Randomly flip a coin.\n\n!flip", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: true,
  execute,
};
