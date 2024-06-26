//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import pmpermit from "../helpers/pmpermit.js";

const execute = async (client: Client, msg: Message) => {
  msg.delete(true);
  if (config.pmpermit_enabled == "true" && !msg.to.includes("-")) {
    await pmpermit.permit(msg.to.split("@")[0]);
    msg.reply(
      "*✅ Allowed*\n\nYou are allowed for PM\n\n _Powered by WhatsBot_",
    );
  }
};

const command: Command = {
  name: "Allow for PM",
  description: "Allow personal messaging for a conatct",
  command: "!allow",
  commandType: "admin",
  isDependent: false,
  help: `_You can allow him for pm by these commands_ 👇\n*!allow* - Allow an user for PM\n*!nopm* - Disallow an allowed user for PM`, // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: false,
  execute,
};

export default command;
