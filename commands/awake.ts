import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

//jshint esversion:8
const execute = async (client: Client, msg: Message) => {
  client.sendPresenceAvailable();
  await sendLocalized(client, msg, "awake.success");
};

const command: Command = {
  name: "awake.name",
  description: "awake.description",
  command: "!awake",
  commandType: "plugin",
  isDependent: false,
  help: undefined,
  public: false,
  execute,
};

export default command;
