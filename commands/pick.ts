import { Client, Message } from "whatsapp-web.js";

//jshint esversion:8
const execute = async (_client: Client, msg: Message, args: string[]) => {
  if (msg.hasQuotedMsg) {
    args = (await msg.getQuotedMessage())?.body?.split("");
  }
  args = args.map((arg) => {
    return arg.replace(/!*(\S+)/, "$1");
  });
  if (!args.length) {
    return msg.reply("Please provide options!");
  }
  msg.reply(args[Math.floor(Math.random() * args.length)]);
};

export default {
  name: "Pick", //name of the module
  description: "Pick an option for you", // short description of what this command does
  command: "!pick", //command with prefix. Ex command: '!test'
  commandType: "plugin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "Randomly pick an option.\n\n!flip [option1] [option2] [option3] etc.", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: true,
  execute,
};
