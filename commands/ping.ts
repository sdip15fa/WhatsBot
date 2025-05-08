//jshint esversion:6

import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message) => {
  await sendLocalized(client, msg, "PING_RESPONSE");
};

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
