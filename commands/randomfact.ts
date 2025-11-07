//jshint esversion:6

import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message) => {
  try {
    const response = await fetch("https://uselessfacts.jsph.pl/random.json?language=en");

    if (!response.ok) {
      await sendLocalized(client, msg, "randomfact.error");
      return;
    }

    const data = await response.json();
    await msg.reply(`💡 *Random Fact*\n\n${data.text}`);
  } catch (error) {
    console.error("Error fetching random fact:", error);
    await sendLocalized(client, msg, "randomfact.error");
  }
};

const command: Command = {
  name: "RandomFact",
  description: "Get random interesting facts",
  command: "!fact",
  commandType: "plugin",
  isDependent: false,
  help: undefined,
  execute,
  public: true,
};

export default command;
