import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { startAfk, afkStatus, stopAfk } from "../helpers/afkWrapper.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  try {
    const commandType = args.shift();

    switch (commandType) {
      case "on": {
        const getstatus = afkStatus();
        if (getstatus.on) throw new Error("Already AFK mode is on.");
        let message = args.join(" ");
        if (!message) message = "Currently I'm away. I will be back soon!";
        startAfk(message);
        const msgtosend = `AFK mode is now on.\n\nMessage: ${message}`;
        await client.sendMessage(msg.to, msgtosend);
        break;
      }
      case "off": {
        const getstatus = afkStatus();
        if (!getstatus.on) throw new Error("Already AFK mode is off.");
        stopAfk();
        const msgtosend = "AFK mode is now off.";
        await client.sendMessage(msg.to, msgtosend);
        break;
      }
      case "status": {
        const getstatus = afkStatus();
        const msgtosend = `AFK mode is ${getstatus.on ? "on" : "off"}.${
          getstatus.on ? `\n\nMessage: ${getstatus.message}` : ""
        }`;

        await client.sendMessage(msg.to, msgtosend);
        break;
      }
      default: {
        throw new Error(
          "Invalid argument. Valid arguments are: on, off, status",
        );
      }
    }
  } catch (error) {
    const messagetosend = `Afk command failed.\n\n${error?.message}`;
    await client.sendMessage(msg.to, messagetosend);
  }
};

const command: Command = {
  name: "afk", //name of the module
  description: "Turn on or off afk mode", // short description of what this command does
  command: "!afk", //command with prefix. Ex command: '!test'
  commandType: "admin", // admin|info|plugin
  isDependent: false, //whether this command is related/dependent to some other command
  help: "*Afk*\n\n1. *!afk on Message* to turn on afk.\n2. *!afk off* to turn off afk.\n3. *!afk status* to check current status of afk.", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: false,
  execute,
};

export default command;

// switch to es6 syntax
