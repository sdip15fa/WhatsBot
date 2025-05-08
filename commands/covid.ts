//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import db from "../db/index.js";
import { agenda } from "../helpers/agenda.js";
import { getDate, getTime } from "../helpers/date.js";
import { getName } from "../helpers/getName.js";
import Covid, { CovidStatus } from "../models/covid.js";
import {
  sendLocalized,
  getGroupLanguage,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chat = await msg.getChat();
  const chatId = chat.id._serialized;
  const userLanguage = await getGroupLanguage(msg);

  if (args[0] === "subscribe") {
    if (
      !(
        await agenda.jobs({
          name: "send covid status", // Changed agenda job name
          "data.groupId": chatId,
        })
      )?.length
    ) {
      await agenda.every(
        "59 23 * * *",
        "send covid status", // Changed agenda job name
        { groupId: chatId },
        {
          timezone: "Asia/Hong_Kong",
          skipImmediate: true,
        },
      );
      return await sendLocalized(client, msg, "covid.subscribe.success");
    } else {
      return await sendLocalized(
        client,
        msg,
        "covid.subscribe.already_subscribed",
      );
    }
  }

  if (args[0] === "status") {
    const date = /^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(args[1])
      ? args[1]
      : getDate();
    const covid = (await db("covid").coll.findOne({
      date,
      chatId,
    })) as Covid;
    if (!covid) {
      return await sendLocalized(client, msg, "covid.status.no_data");
    }
    const positive = covid.status.filter((v) => v.rat === "positive");
    const negative = covid.status.filter((v) => v.rat === "negative");

    let statusMessage = getString("covid.status.header", userLanguage, {
      chatName: chat.name || "",
      date: covid.date,
    });

    if (positive.length > 0) {
      statusMessage += `\n\n${getString(
        "covid.status.positive_header",
        userLanguage,
      )}\n`;
      const people: string[] = [];
      positive.forEach((v) => {
        if (!people.includes(v.id)) {
          people.push(v.id);
        }
      });
      statusMessage += people
        .map(
          (p) =>
            `_${positive.find((v) => v.id === p).name}_\n${positive
              .filter((v) => v.id === p)
              .map(
                (v) =>
                  `${v.time}: ${v.temperature || ""}${
                    v.symptoms ? ` ${v.symptoms}` : ""
                  }`,
              )
              .join("\n")}`,
        )
        .join("\n\n");
    }

    if (negative.length > 0) {
      statusMessage += `\n\n${getString(
        "covid.status.negative_header",
        userLanguage,
      )}\n`;
      const people: string[] = [];
      negative.forEach((v) => {
        if (!people.includes(v.id)) {
          people.push(v.id);
        }
      });
      statusMessage += people
        .map(
          (p) =>
            `_${negative.find((v) => v.id === p).name}_\n${negative
              .filter((v) => v.id === p)
              .map(
                (v) =>
                  `${v.time}: ${v.temperature || ""}${
                    v.symptoms ? ` ${v.symptoms}` : ""
                  }`,
              )
              .join("\n")}`,
        )
        .join("\n\n");
    }

    return await client.sendMessage(chatId, statusMessage);
  }

  const rat = {
    positive: "positive",
    negative: "negative",
    "+": "positive",
    "-": "negative",
    "1": "positive",
    "0": "negative",
    true: "positive",
    false: "negative",
  }[args[0].toLowerCase().trim()];

  if (!rat) {
    return await sendLocalized(client, msg, "covid.report.invalid_rat");
  }

  const temperature = Number(args[1]);
  if (temperature < 35 || temperature > 42) {
    return await sendLocalized(client, msg, "covid.report.invalid_temperature");
  }

  const symptoms = args.filter((_v, i) => i > (temperature ? 1 : 0)).join(" ");

  const date = getDate();
  const time = getTime();

  const userId = msg.fromMe ? process.env.WTS_OWNER_ID : msg.author || msg.from;

  const covidStatusEntry: CovidStatus = {
    id: userId,
    name: await getName(userId),
    time,
    rat: rat as "positive" | "negative", // Cast rat to the expected type
  };
  if (temperature) covidStatusEntry.temperature = temperature;
  if (symptoms) covidStatusEntry.symptoms = symptoms;

  if (
    !(
      await db("covid").coll.updateOne(
        { date, chatId },
        {
          $push: {
            status: covidStatusEntry,
          },
        },
      )
    ).matchedCount
  ) {
    const newCovidEntry: Covid = {
      date,
      chatId,
      status: [covidStatusEntry],
    };
    await db("covid").coll.insertOne(newCovidEntry);
  }

  await sendLocalized(client, msg, "covid.report.success");
};

const command: Command = {
  name: "covid.name",
  description: "covid.description",
  command: "!covid",
  commandType: "plugin",
  isDependent: false,
  help: "covid.help",
  execute,
  public: true,
};

export default command;
