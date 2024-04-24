//jshint esversion:8

import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { exec } from "child_process";

const execute = async (client: Client, msg: Message, args: string[]) => {
  exec(args.join(" "), async (error, stdout, stderr) => {
    if (error) {
      await client.sendMessage(msg.to, "*whatsbot~:* ```" + error + "```");
    } else if (stderr) {
      await client.sendMessage(msg.to, "*whatsbot~:* ```" + stderr + "```");
    } else {
      await client.sendMessage(msg.to, "*whatsbot~:* ```" + stdout + "```");
    }
  });
};

const command: Command = {
  name: "Terminal",
  description: "Use teminal remotely",
  command: "!term",
  commandType: "plugin",
  isDependent: false,
  help: "*Terminal*\n\nYou can execute any command with this.\n\n*!term [command]*\nTo execute a command. Ex: ```!term cd ./temp/```",
  execute,
  public: false,
};

export default command;
