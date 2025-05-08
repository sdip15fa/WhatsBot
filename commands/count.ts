//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { agenda } from "../helpers/agenda.js";
import { countMessage } from "../helpers/count.js";
import { getDate } from "../helpers/date.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

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
      return await sendLocalized(client, msg, "count.subscribe.success");
    } else {
      return await sendLocalized(
        client,
        msg,
        "count.subscribe.already_subscribed",
      );
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
      return await sendLocalized(client, msg, "count.unsubscribe.success");
    } else {
      return await sendLocalized(
        client,
        msg,
        "count.unsubscribe.not_subscribed",
      );
    }
  }

  const date = /^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(args[0])
    ? args[0]
    : getDate();

  const messageCountResult = await countMessage(chatId, chat.name || "", date);
  await client.sendMessage(chatId, messageCountResult); // countMessage already returns a formatted string
};

const command: Command = {
  name: "count.name",
  description: "count.description",
  command: "!count",
  commandType: "plugin",
  isDependent: false,
  help: "count.help",
  execute,
  public: true,
};

export default command;
