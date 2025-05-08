import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

//jshint esversion:8
const execute = async (client: Client, msg: Message) => {
  msg.delete(true);
  if (!msg.to.includes("-")) {
    await sendLocalized(client, msg, "block.success");
    const chat = await msg.getChat();
    const contact = await chat.getContact();
    contact.block();
  }
};

const command: Command = {
  name: "block.name", //name of the module
  description: "block.description", // short description of what this command does
  command: "!block", //command with prefix. Ex command: '!test'
  commandType: "admin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "block.help", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: false,
  execute,
};

export default command;
