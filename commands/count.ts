//jshint esversion:8
// Coded by Sumanjay (https://github.com/cyberboysumanjay)
import { Client, Message } from "whatsapp-web.js";
import db from "../db";
import { getDate } from "../helpers/date";

async function getCount(groupId: string, date: string) {
  const count = (await db("count").coll.findOne({ groupId, date }))?.count;
  if (!count) {
    return null;
  }
  return count;
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  let date = /^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(args[0])
    ? args[0]
    : getDate();
  const count = await getCount(chatId, date);
  if (!count) {
    client.sendMessage(chatId, `Count not available or date invalid.`);
  }
  await client.sendMessage(
    chatId,
    `Number of messages in ${(await msg.getChat()).name} on ${date}:
${count}`
  );
};

module.exports = {
  name: "Count",
  description: "Get count of messages in the chat",
  command: "!count",
  commandType: "plugin",
  isDependent: false,
  help: `*count*\n\nGet number of messages in the chat. \n\n*!count [date]\n\nDate should be in format 'YYYY-MM-DD'.\n\nDate defaults to today's date if not provided.`,
  execute,
  public: true,
};
