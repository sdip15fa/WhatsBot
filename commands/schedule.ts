//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { agenda } from "../helpers/agenda";

const execute = async (client: Client, msg: Message, args: string[]) => {
  if (!msg.hasQuotedMsg) {
    return await msg.reply("Please quote a message to schedule!");
  }
  const chatId = args.shift();
  const date = args.join(" ");
  await client.getChatById(chatId).catch(async () => {
    return await msg.reply("Chat not found");
  });
  const quoted = await msg.getQuotedMessage();
  await agenda.schedule(date, "send message", {
    chatId,
    body: quoted.body,
    sticker: quoted.type === "sticker",
    ...(quoted.hasMedia && { media: quoted.downloadMedia() }),
  });
  await msg.reply("Scheduled!");
};

module.exports = {
  name: "Schedule message",
  description: "Schedule a message to be sent at a specific time",
  command: "!schedule",
  commandType: "plugin",
  isDependent: false,
  help: `**\n\nSchedule a message to be sent at a specific time.\n\nReply to the message you want to schedule.\n\n*!schedule [chat id] [time]\n\nTime example: \`in 1 minute\`\n\nFor list of chats and chat ids, use !chatlist.`,
  execute,
  public: false,
};
