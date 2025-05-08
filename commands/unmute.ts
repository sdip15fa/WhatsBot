import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

//jshint esversion:8
const execute = async (client: Client, msg: Message) => {
  if (!msg.to.includes("-")) {
    const chat = await msg.getChat();
    await chat.unmute();
    sendLocalized(client, msg, "unmute.success");
  }
};

const command: Command = {
  name: "Unmute", //name of the module
  description: "Unmute a muted chat", // short description of what this command does
  command: "!unmute", //command with prefix. Ex command: '!test'
  commandType: "admin", //
  isDependent: true, //whether this command is related/dependent to some other command
  help: "unmute.help", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  execute,
  public: false,
};

export default command;
