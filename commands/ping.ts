//jshint esversion:6

import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

const execute = (client: Client, msg: Message) => msg.reply("pong");

const command: Command = {
  name: "Ping",
  description: "responds with pong",
  command: "!ping",
  commandType: "info",
  isDependent: false,
  help: undefined,
  execute,
  public: true,
};

export default command;
