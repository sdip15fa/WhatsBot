//jshint esversion:6

import { Client, Message } from "whatsapp-web.js";

const execute = (client: Client, msg: Message) => msg.reply("pong");

module.exports = {
  name: "Ping",
  description: "responds with pong",
  command: "!ping",
  commandType: "info",
  isDependent: false,
  help: undefined,
  execute,
  public: true
};
