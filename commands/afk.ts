import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { startAfk, afkStatus, stopAfk } from "../helpers/afkWrapper.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  try {
    const commandType = args.shift();

    switch (commandType) {
      case "on": {
        const getstatus = afkStatus();
        if (getstatus.on) throw new Error("afk.already_on");
        let message = args.join(" ");
        if (!message) message = "afk.default_message";
        startAfk(message);
        await sendLocalized(client, msg, "afk.on_success", { message });
        break;
      }
      case "off": {
        const getstatus = afkStatus();
        if (!getstatus.on) throw new Error("afk.already_off");
        stopAfk();
        await sendLocalized(client, msg, "afk.off_success");
        break;
      }
      case "status": {
        const getstatus = afkStatus();
        const statusKey = getstatus.on ? "afk.status_on" : "afk.status_off";
        const messageKey = getstatus.on ? "afk.status_message" : null;

        await sendLocalized(client, msg, statusKey, {
          message: getstatus.message,
        });
        break;
      }
      default: {
        throw new Error("afk.invalid_argument");
      }
    }
  } catch (error) {
    await sendLocalized(client, msg, "afk.command_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

const command: Command = {
  name: "afk", //name of the module
  description: "afk.description", // short description of what this command does
  command: "!afk", //command with prefix. Ex command: '!test'
  commandType: "admin", // admin|info|plugin
  isDependent: false, //whether this command is related/dependent to some other command
  help: "afk.help", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: false,
  execute,
};

export default command;

// switch to es6 syntax
