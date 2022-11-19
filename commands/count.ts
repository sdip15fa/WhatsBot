//jshint esversion:8
// Coded by Sumanjay (https://github.com/cyberboysumanjay)
import { Client, Message } from "whatsapp-web.js";
import { countMessage } from "../helpers/count";
import { getDate } from "../helpers/date";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chat = await msg.getChat();
  const chatId = chat.id._serialized;
  let date = /^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(args[0])
    ? args[0]
    : getDate();

  await client.sendMessage(
    chatId,
    await countMessage(chatId, chat.name || "", date)
  );
};

module.exports = {
  name: "Count",
  description: "Get count of messages in the chat",
  command: "!count",
  commandType: "plugin",
  isDependent: false,
  help: `*count*\n\nGet number of messages in the chat. \n\n*!count [date]*\n\nDate should be in format 'YYYY-MM-DD'.\n\nDate defaults to today's date if not provided.`,
  execute,
  public: true,
};
