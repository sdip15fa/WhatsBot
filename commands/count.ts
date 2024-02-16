//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { agenda } from "../helpers/agenda.js";
import { countMessage } from "../helpers/count.js";
import { getDate } from "../helpers/date.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chat = await msg.getChat();
  const chatId = chat.id._serialized;

  if (args[0] === "subscribe") {
    if (
      !(
        await agenda.jobs({
          name: "send count",
          "data.groupId": chatId,
        })
      )?.length
    ) {
      await agenda.every(
        "59 23 * * *",
        "send count",
        { groupId: chatId },
        {
          timezone: "Asia/Hong_Kong",
          skipImmediate: true,
        },
      );
      return await client.sendMessage(
        chatId,
        "Subscribed! Message counts will be sent at 23:59 every day.",
      );
    } else {
      return await client.sendMessage(chatId, "Already subscribed!");
    }
  }

  if (args[0] === "unsubscribe") {
    if (
      (
        await agenda.jobs({
          name: "send count",
          "data.groupId": chatId,
        })
      )?.length
    ) {
      await agenda.cancel({
        name: "send count",
        "data.groupId": chatId,
      });
      return await client.sendMessage(chatId, "Unsubscribed!");
    } else {
      return await client.sendMessage(chatId, "Not subscribed!");
    }
  }

  const date = /^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(args[0])
    ? args[0]
    : getDate();

  await client.sendMessage(
    chatId,
    await countMessage(chatId, chat.name || "", date),
  );
};

const command: Command = {
  name: "Count",
  description: "Get count of messages in the chat",
  command: "!count",
  commandType: "plugin",
  isDependent: false,
  help: `*count*\n\nGet number of messages in the chat. \n\n*!count [date]*\n\nDate should be in format 'YYYY-MM-DD'.\n\nDate defaults to today's date if not provided. Use subscribe or unsubscribe as date to subscribe or unsubscribe.`,
  execute,
  public: true,
};

export default command;
