//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import pmpermit from "../helpers/pmpermit.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message) => {
  msg.delete(true);
  if (config.pmpermit_enabled == "true" && !msg.to.includes("-")) {
    await pmpermit.permit(msg.to.split("@")[0]);
    await sendLocalized(client, msg, "allow.success");
  }
};

const command: Command = {
  name: "allow.name",
  description: "allow.description",
  command: "!allow",
  commandType: "admin",
  isDependent: false,
  help: "allow.help",
  public: false,
  execute,
};

export default command;
