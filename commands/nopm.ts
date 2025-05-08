import { sendLocalized } from "../helpers/localizedMessenger.js";
//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import pmpermit from "../helpers/pmpermit.js";

const execute = async (client: Client, msg: Message) => {
  if (config.pmpermit_enabled == "true" && !msg.to.includes("-")) {
    await pmpermit.nopermit(msg.to.split("@")[0]);
    await sendLocalized(client, msg, "nopm.success");
  }
};

const command: Command = {
  name: "Disallow PM", //name of the module
  description: "nopm.description", // short description of what this command does
  command: "!nopm", //command with prefix. Ex command: '!test'
  commandType: "admin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "nopm.help", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  execute,
  public: false,
};

export default command;
