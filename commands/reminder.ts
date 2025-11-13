//jshint esversion:6

import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";
import * as chrono from "chrono-node";

interface Reminder {
  chatId: string;
  message: string;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
}

const reminders: Map<string, Reminder[]> = new Map();

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chat = await msg.getChat();

  if (args.length === 0) {
    await sendLocalized(client, msg, "reminder.no_argument");
    return;
  }

  const subCommand = args[0].toLowerCase();

  if (subCommand === "list") {
    const chatReminders = reminders.get(chat.id._serialized) || [];
    if (chatReminders.length === 0) {
      await sendLocalized(client, msg, "reminder.list.empty");
      return;
    }

    const reminderList = chatReminders
      .map((r, i) => {
        const date = new Date(r.timestamp);
        return `${i + 1}. ${date.toLocaleString()} - ${r.message}`;
      })
      .join("\n");

    await msg.reply(`*Reminders:*\n\n${reminderList}`);
    return;
  }

  if (subCommand === "clear") {
    const chatReminders = reminders.get(chat.id._serialized) || [];
    chatReminders.forEach((r) => clearTimeout(r.timeoutId));
    reminders.delete(chat.id._serialized);
    await sendLocalized(client, msg, "reminder.clear.success");
    return;
  }

  // Parse time and message
  const input = args.join(" ");
  const parsed = chrono.parse(input);

  if (parsed.length === 0) {
    await sendLocalized(client, msg, "reminder.parse_error");
    return;
  }

  const reminderDate = parsed[0].start.date();
  const now = new Date();

  if (reminderDate <= now) {
    await sendLocalized(client, msg, "reminder.past_time");
    return;
  }

  // Extract message (everything after the time expression)
  const timeText = parsed[0].text;
  const messageStart = input.indexOf(timeText) + timeText.length;
  const reminderMessage = input.substring(messageStart).trim() || "Reminder!";

  const delay = reminderDate.getTime() - now.getTime();

  const timeoutId = setTimeout(async () => {
    try {
      await client.sendMessage(
        chat.id._serialized,
        `⏰ *Reminder*\n\n${reminderMessage}`,
      );

      // Remove from reminders list
      const chatReminders = reminders.get(chat.id._serialized) || [];
      const index = chatReminders.findIndex((r) => r.timeoutId === timeoutId);
      if (index > -1) {
        chatReminders.splice(index, 1);
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
    }
  }, delay);

  const reminder: Reminder = {
    chatId: chat.id._serialized,
    message: reminderMessage,
    timestamp: reminderDate.getTime(),
    timeoutId,
  };

  if (!reminders.has(chat.id._serialized)) {
    reminders.set(chat.id._serialized, []);
  }
  reminders.get(chat.id._serialized)!.push(reminder);

  await msg.reply(
    `✅ Reminder set for ${reminderDate.toLocaleString()}\n\n${reminderMessage}`,
  );
};

const command: Command = {
  name: "Reminder",
  description: "Set reminders for later",
  command: "!remind",
  commandType: "plugin",
  isDependent: false,
  help: undefined,
  execute,
  public: true,
};

export default command;
