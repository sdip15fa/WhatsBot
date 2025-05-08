//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import db from "../db/index.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;

  await db("gpt").coll.deleteOne({ id: chatId });

  await sendLocalized(client, msg, "cleargpt.success");
};

const command: Command = {
  name: "cleargpt.name",
  description: "cleargpt.description",
  command: "!cleargpt",
  commandType: "plugin",
  isDependent: false,
  help: "cleargpt.help",
  execute,
  public: true,
};

export default command;
