//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import db from "../db/index.js";
import Story from "../models/story.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  switch (args[0]) {
    case "add": {
      const text = args[1];
      if (!text) {
        return await client.sendMessage(chatId, "Please provide a word!");
      }
      if (text.length > 15) {
        return await client.sendMessage(
          chatId,
          "Word is too long (maximum is 15 characters)",
        );
      }
      if (Number(args[2])) {
        if (
          !(
            await db("story").coll.updateOne(
              { chatId, id: Number(args[2]) },
              { $push: { story: text }, $currentDate: { lastModified: true } },
            )
          ).matchedCount
        ) {
          return await client.sendMessage(chatId, "Story not found.");
        } else {
          return await client.sendMessage(
            chatId,
            `Story updated: added \`\`\`${text}\`\`\``,
          );
        }
      }
      if (
        !(
          await db("story").coll.updateOne(
            { chatId, current: true },
            { $push: { story: text }, $currentDate: { lastModified: true } },
          )
        ).matchedCount
      ) {
        await db("story").coll.insertOne(<Story>{
          id:
            ((
              (await db("story")
                .coll.find({ chatId })
                .sort({ id: -1 })
                .limit(1)
                .toArray()) as Story[]
            )?.[0]?.id || 0) + 1,
          chatId,
          current: true,
          story: [text],
          createdAt: new Date(),
          lastModified: new Date(),
        });
      }
      await client.sendMessage(
        chatId,
        `Story updated: added \`\`\`${text}\`\`\``,
      );
      break;
    }
    case "see": {
      const story = (await db("story").coll.findOne({
        chatId,
        ...(Number(args[1]) ? { id: Number(args[1]) } : { current: true }),
      })) as Story | null;
      if (story) {
        await client.sendMessage(
          chatId,
          `${Number(args[1]) ? `Story ${Number(args[1])}` : "Current story"}:
${story.story.join(" ")}`,
        );
      } else {
        await client.sendMessage(chatId, "Story doesn't exist.");
      }
      break;
    }
    case "new": {
      const text = args[1];
      if (!text) {
        return await client.sendMessage(chatId, "Please provide a word!");
      }
      if (text.length > 15) {
        return await client.sendMessage(
          chatId,
          "Word is too long (maximum is 15 characters)",
        );
      }

      await db("story").coll.updateMany(
        { chatId },
        { $set: { current: false } },
      );

      await db("story").coll.insertOne(<Story>{
        id:
          ((
            (await db("story")
              .coll.find({ chatId })
              .sort({ id: -1 })
              .limit(1)
              .toArray()) as Story[]
          )?.[0]?.id || 0) + 1,
        current: true,
        chatId,
        story: [text],
        createdAt: new Date(),
        lastModified: new Date(),
      });

      await client.sendMessage(
        chatId,
        `New story created: \`\`\`${text}\`\`\``,
      );
      break;
    }
    case "list": {
      const stories = (await db("story")
        .coll.find({ chatId })
        .sort({ id: 1 })
        .skip(((Number(args[1]) || 1) - 1) * 10)
        .limit(10)
        .toArray()) as Story[];
      if (!stories.length) {
        return await client.sendMessage(chatId, "No stories found.");
      }
      await client.sendMessage(
        chatId,
        `Stories:

${stories
  .map((story) => {
    return `${story.id}${story.current ? " (Current)" : ""}:
Created: ${new Date(story.createdAt).toLocaleString("en-UK", {
      timeZone: process.env.TZ,
    })}
Last modified: ${new Date(story.lastModified).toLocaleString("en-UK", {
      timeZone: process.env.TZ,
    })}
Content: ${story.story.filter((_v, i) => i < 10).join(" ")}${
      story.story.length > 10 ? "..." : ""
    }`;
  })
  .join("\n\n")}`,
      );
      break;
    }
    case "current": {
      if (Number(args[1])) {
        if (await db("story").coll.findOne({ chatId, id: Number(args[1]) })) {
          await db("story").coll.updateMany(
            { chatId },
            { $set: { current: false } },
          );
          await db("story").coll.updateOne(
            { chatId, id: Number(args[1]) },
            { $set: { current: true } },
          );
          await client.sendMessage(
            chatId,
            `Current story set to ${Number(args[1])}`,
          );
        } else {
          await client.sendMessage(chatId, "Story doesn't exist!");
        }
      } else {
        const id = (
          (await db("story").coll.findOne({
            chatId,
            current: true,
          })) as Story | null
        )?.id;
        await client.sendMessage(
          chatId,
          id ? `Current story id: ${id}` : "No stories yet.",
        );
      }
      break;
    }
    case "pop": {
      if (!msg.fromMe) {
        return await client.sendMessage(chatId, "You can't do that.");
      }
      if (
        !(
          await db("story").coll.updateOne(
            {
              chatId,
              ...(Number(args[1])
                ? { id: Number(args[1]) }
                : { current: true }),
            },
            { $pop: { story: 1 } },
          )
        ).modifiedCount
      ) {
        return await client.sendMessage(
          chatId,
          "Nothing was removed. Please check.",
        );
      }
      await client.sendMessage(chatId, "Last word removed.");
      break;
    }
    case "remove": {
      if (!msg.fromMe) {
        return await client.sendMessage(chatId, "You can't do that.");
      }
      if (
        !(await db("story").coll.deleteOne({ chatId, id: Number(args[1]) }))
          .deletedCount
      ) {
        return await client.sendMessage(
          chatId,
          "Nothing was removed. Please check.",
        );
      }
      await client.sendMessage(chatId, `Story ${Number(args[1])} removed.`);
      break;
    }
    default: {
      await client.sendMessage(
        chatId,
        `Use \`\`\`!help story\`\`\` for syntax.`,
      );
      break;
    }
  }
};

const command: Command = {
  name: "Story",
  description: "One word story",
  command: "!story",
  commandType: "plugin",
  isDependent: false,
  help: `*Story*\n\nOne word story. See the commands.\n\n*Commands*\n\n!story add [one word] [id]\n!story new [one word]\n!story see [id]\n!story list [page]\n!story current [id]\n\n*Owner Only*\n\n!story pop [id]\n!story remove [id]`,
  execute,
  public: true,
};

export default command;
