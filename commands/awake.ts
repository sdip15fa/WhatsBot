import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

//jshint esversion:8
const execute = async (client: Client, msg: Message) => {
  client.sendPresenceAvailable();
  msg.reply("```" + "I will be online from now." + "```");
};

const command: Command = {
  name: "Awake",
  description: "Stay online always !",
  command: "!awake",
  commandType: "plugin",
  isDependent: false,
  help: undefined,
  public: false,
  execute,
};

export default command;
