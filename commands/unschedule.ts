//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { agenda } from "../helpers/agenda.js";

const execute = async (_client: Client, msg: Message, args: string[]) => {
  const id = args[0];

  if (!id) {
    await msg.reply("Please include an id!");
  }
  if (!(await agenda.jobs({ "data.id": id })).length) {
    return await msg.reply("Job not found!");
  }

  await agenda.cancel({ name: "send message", "data.id": id });

  await msg.reply(`Unscheduled job id \`\`\`${id}\`\`\`.`);
};

export default {
  name: "Unschedule message",
  description: "Unschedule a message previously scheduled.",
  command: "!unschedule",
  commandType: "plugin",
  isDependent: false,
  help: `**\n\nUnschedule a message previously scheduled.\n\n*!unschedule [job id]`,
  execute,
  public: false,
};
