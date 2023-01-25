//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";

const execute = async (client: Client, msg: Message) => {
  if (!msg.to.includes("-")) {
    const chat = await msg.getChat();
    const unmuteDate = new Date();
    unmuteDate.setSeconds(Number(unmuteDate.getSeconds()) + 3600);
    await chat.mute(unmuteDate);
    msg.reply(
      `*🤫 Muted*\n\nYou have been muted for 1 hour\n\n _Powered by WhatsBot_`
    );
  }
};

module.exports = {
  name: "Mute", //name of the module
  description: "mute the current chat", // short description of what this command does
  command: "!mute", //command with prefix. Ex command: '!test'
  commandType: "admin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: `Type !mute in chat to mute the chat for 1 hour. use !unmute to unmute the chat.`, // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  execute,
  public: false,
};
