//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import db from "../db";
import { agenda } from "../helpers/agenda";
import { countMessage } from "../helpers/count";
import { getDate, getTime } from "../helpers/date";
import { getName } from "../helpers/getName";
import Covid, { CovidStatus } from "../models/covid";

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
        }
      );
      return await client.sendMessage(
        chatId,
        "Subscribed! Message counts will be sent at 23:59 every day."
      );
    } else {
      return await client.sendMessage(chatId, "Already subscribed!");
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
      return await client.sendMessage(chatId, "Data not available.");
    }
    const positive = covid.status.filter((v) => v.rat === "positive");
    const negative = covid.status.filter((v) => v.rat === "negative");
    return await client.sendMessage(
      chatId,
      `Covid status in ${chat.name} on ${covid.date}:${
        !positive.length
          ? ""
          : `
      
*Positive*
${(() => {
  const people: string[] = [];
  positive.forEach((v) => {
    if (!people.includes(v.id)) {
      people.push(v.id);
    }
  });
  return people
    .map(
      (p) =>
        `_${positive.find((v) => v.id === p).name}_\n${positive
          .filter((v) => v.id === p)
          .map(
            (v) =>
              `${v.time}: ${v.temperature}${v.symptoms ? ` ${v.symptoms}` : ""}`
          )
          .join("\n")}`
    )
    .join("\n\n");
})()}`
      }${
        !negative.length
          ? ""
          : `
      
*Negative*
${(() => {
  const people: string[] = [];
  negative.forEach((v) => {
    if (!people.includes(v.id)) {
      people.push(v.id);
    }
  });
  return people
    .map(
      (p) =>
        `_${negative.find((v) => v.id === p).name}_\n${negative
          .filter((v) => v.id === p)
          .map(
            (v) =>
              `${v.time}: ${v.temperature || ""}${v.symptoms ? ` ${v.symptoms}` : ""}`
          )
          .join("\n")}`
    )
    .join("\n\n");
})()}`
      }`
    );
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
    return await client.sendMessage(chatId, "Rat result invalid");
  }

  const temperature = Number(args[1]);
  if (temperature < 35 || temperature > 42) {
    return await client.sendMessage(
      chatId,
      "Temperature must be between 35 and 42"
    );
  }

  const symptoms = args.filter((_v, i) => i > (temperature ? 1 : 0)).join(" ");

  const date = getDate();
  const time = getTime();

  const userId = msg.fromMe ? process.env.WTS_OWNER_ID : msg.author || msg.from;

  if (
    !(
      await db("covid").coll.updateOne(
        { date, chatId },
        {
          $push: {
            status: <CovidStatus>{
              id: userId,
              name: await getName(userId),
              time,
              rat,
              ...(temperature && {temperature}),
              ...(symptoms && { symptoms }),
            },
          },
        }
      )
    ).matchedCount
  )
    await db("covid").coll.insertOne(<Covid>{
      date,
      chatId,
      status: [
        {
          id: userId,
          name: await getName(userId),
          time,
          rat,
          temperature,
          ...(symptoms && { symptoms }),
        },
      ],
    });

  await client.sendMessage(chatId, "Covid status has been updated.");
};

module.exports = {
  name: "Covid",
  description: "Report / get covid status",
  command: "!covid",
  commandType: "plugin",
  isDependent: false,
  help: `*covid*\n\nReport / get covid status.. \n\n*!covid [rat result] [temperature] [symptoms]*\n\n*!covid status [date]*\n\nDate should be in format 'YYYY-MM-DD'.\n\nDate defaults to today's date if not provided.`,
  execute,
  public: true,
};
