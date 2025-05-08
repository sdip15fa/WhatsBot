//jshint esversion:8

import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { exec } from "child_process";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  exec(args.join(" "), async (error, stdout, stderr) => {
    if (error) {
      await sendLocalized(client, msg, "term.error", { error });
    } else if (stderr) {
      await sendLocalized(client, msg, "term.stderr", { stderr });
    } else {
      await sendLocalized(client, msg, "term.stdout", { stdout });
    }
  });
};

const command: Command = {
  name: "Terminal",
  description: "Use teminal remotely",
  command: "!term",
  commandType: "plugin",
  isDependent: false,
  help: "term.help",
  execute,
  public: false,
};

export default command;
