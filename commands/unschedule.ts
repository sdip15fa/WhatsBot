//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { agenda } from "../helpers/agenda";

const execute = async (_client: Client, msg: Message, args: string[]) => {
  if (!msg.hasQuotedMsg) {
    return await msg.reply("Please quote a message to schedule!");
  }
  const id = args[0];

  if (!id) {
    await msg.reply("Please include an id!");
  }
  if (!(await agenda.jobs({ data: { id } })).length) {
    await msg.reply("Job not found!");
  }

  await agenda.cancel({ data: { id } });

  await msg.reply(`Unscheduled job id \`\`\`${id}\`\`\`.`);
};

module.exports = {
  name: "Unschedule message",
  description: "Unschedule a message previously scheduled.",
  command: "!schedule",
  commandType: "plugin",
  isDependent: false,
  help: `**\n\nUnschedule a message previously scheduled.\n\n*!schedule [job id]`,
  execute,
  public: false,
};
