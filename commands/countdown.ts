//jshint esversion:6

import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";
import * as chrono from "chrono-node";

interface Countdown {
  name: string;
  date: Date;
}

const countdowns: Map<string, Countdown[]> = new Map();

const formatTimeLeft = (date: Date): string => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff < 0) {
    return "Event has passed!";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chat = await msg.getChat();

  if (args.length === 0) {
    await sendLocalized(client, msg, "countdown.no_argument");
    return;
  }

  const subCommand = args[0].toLowerCase();

  if (subCommand === "add") {
    const input = args.slice(1).join(" ");
    const parsed = chrono.parse(input);

    if (parsed.length === 0) {
      await sendLocalized(client, msg, "countdown.add.parse_error");
      return;
    }

    const eventDate = parsed[0].start.date();
    const timeText = parsed[0].text;
    const nameStart = input.indexOf(timeText) + timeText.length;
    const eventName = input.substring(nameStart).trim() || "Event";

    const countdown: Countdown = {
      name: eventName,
      date: eventDate,
    };

    if (!countdowns.has(chat.id._serialized)) {
      countdowns.set(chat.id._serialized, []);
    }
    countdowns.get(chat.id._serialized)!.push(countdown);

    await msg.reply(
      `✅ Countdown added!\n\n*${eventName}*\n📅 ${eventDate.toLocaleString()}\n⏱️ ${formatTimeLeft(
        eventDate,
      )}`,
    );
    return;
  }

  if (subCommand === "list") {
    const chatCountdowns = countdowns.get(chat.id._serialized) || [];

    if (chatCountdowns.length === 0) {
      await sendLocalized(client, msg, "countdown.list.empty");
      return;
    }

    let countdownList = "⏱️ *Countdowns*\n\n";

    chatCountdowns.forEach((cd, i) => {
      countdownList += `${i + 1}. *${cd.name}*\n`;
      countdownList += `   📅 ${cd.date.toLocaleString()}\n`;
      countdownList += `   ⏱️ ${formatTimeLeft(cd.date)}\n\n`;
    });

    await msg.reply(countdownList);
    return;
  }

  if (subCommand === "remove") {
    const index = parseInt(args[1]) - 1;
    const chatCountdowns = countdowns.get(chat.id._serialized) || [];

    if (isNaN(index) || index < 0 || index >= chatCountdowns.length) {
      await sendLocalized(client, msg, "countdown.remove.invalid_index");
      return;
    }

    const removed = chatCountdowns.splice(index, 1)[0];
    await msg.reply(`✅ Removed countdown: ${removed.name}`);
    return;
  }

  if (subCommand === "check") {
    const index = parseInt(args[1]) - 1;
    const chatCountdowns = countdowns.get(chat.id._serialized) || [];

    if (isNaN(index) || index < 0 || index >= chatCountdowns.length) {
      await sendLocalized(client, msg, "countdown.check.invalid_index");
      return;
    }

    const cd = chatCountdowns[index];
    await msg.reply(
      `⏱️ *${cd.name}*\n\n📅 ${cd.date.toLocaleString()}\n⏱️ ${formatTimeLeft(
        cd.date,
      )}`,
    );
    return;
  }

  await sendLocalized(client, msg, "countdown.invalid_command");
};

const command: Command = {
  name: "Countdown",
  description: "Count down to a specific date/event",
  command: "!countdown",
  commandType: "plugin",
  isDependent: false,
  help: undefined,
  execute,
  public: true,
};

export default command;
