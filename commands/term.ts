//jshint esversion:8

import { Client, Message } from "whatsapp-web.js";
import { exec } from "child_process";

const execute = async (client: Client, msg: Message, args: string[]) => {
  exec("cd public && " + args.join(" "), async (error, stdout, stderr) => {
    if (error) {
      await client.sendMessage(msg.to, "*whatsbot~:* ```" + error + "```");
    } else if (stderr) {
      await client.sendMessage(msg.to, "*whatsbot~:* ```" + stderr + "```");
    } else {
      await client.sendMessage(msg.to, "*whatsbot~:* ```" + stdout + "```");
    }
  });
};

module.exports = {
  name: "Terminal",
  description: "Use teminal remotely",
  command: "!term",
  commandType: "plugin",
  isDependent: false,
  help: "*Terminal*\n\nYou can execute any command with this. By default it will run from _public_ directory. If you are leeching something it will be available publicly at\n_http://[Your-App-Url]/public_\n\n*!term [command]*\nTo execute a command. Ex: ```!term cd ./temp/```",
  execute,
};
