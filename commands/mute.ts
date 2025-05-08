import { sendLocalized } from "../helpers/localizedMessenger.js";
//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

const execute = async (client: Client, msg: Message) => {
  if (!msg.to.includes("-")) {
    const chat = await msg.getChat();
    const unmuteDate = new Date();
    unmuteDate.setSeconds(Number(unmuteDate.getSeconds()) + 3600);
    await chat.mute(unmuteDate);
    sendLocalized(client, msg, "mute.success");
  }
};

const command: Command = {
  name: "Mute", //name of the module
  description: "mute.description", // short description of what this command does
  command: "!mute", //command with prefix. Ex command: '!test'
  commandType: "admin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "mute.help", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  execute,
  public: false,
};

export default command;
