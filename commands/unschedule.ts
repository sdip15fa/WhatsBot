//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { agenda } from "../helpers/agenda.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (_client: Client, msg: Message, args: string[]) => {
  const id = args[0];

  if (!id) {
    await sendLocalized(_client, msg, "unschedule.no_id");
    return;
  }
  if (!(await agenda.jobs({ "data.id": id })).length) {
    return await sendLocalized(_client, msg, "unschedule.job_not_found");
  }

  await agenda.cancel({ name: "send message", "data.id": id });

  await sendLocalized(_client, msg, "unschedule.success", { id });
};

const command: Command = {
  name: "Unschedule message",
  description: "Unschedule a message previously scheduled.",
  command: "!unschedule",
  commandType: "plugin",
  isDependent: false,
  help: "unschedule.help",
  execute,
  public: false,
};

export default command;
