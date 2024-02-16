//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import pmpermit from "../helpers/pmpermit.js";

const execute = async (client: Client, msg: Message) => {
  if (config.pmpermit_enabled == "true" && !msg.to.includes("-")) {
    await pmpermit.nopermit(msg.to.split("@")[0]);
    msg.reply(
      "*⛔ Not Allowed*\n\nYou are not allowed for PM\n\n _Powered by WhatsBot_",
    ); // don't change this text without discussion with Tuhin
  }
};

const command: Command = {
  name: "Disallow PM", //name of the module
  description: "Disallow an allowed user for Personal messaging", // short description of what this command does
  command: "!nopm", //command with prefix. Ex command: '!test'
  commandType: "admin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "Type !nopm in the chat to execute.", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  execute,
  public: false,
};

export default command;
