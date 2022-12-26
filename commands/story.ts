//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import db from "../db";
import Story from "../models/story";

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
          "Word is too long (maximum is 15 characters)"
        );
      }
      if (
        !(
          await db("story").coll.updateOne(
            { chatId },
            { $push: { story: text }, $currentDate: { lastModified: true } }
          )
        ).matchedCount
      ) {
        await db("story").coll.insertOne(<Story>{
          id: (await db("story").coll.countDocuments({ chatId })) + 1,
          chatId,
          story: [text],
          createdAt: new Date(),
          lastModified: new Date(),
        });
      }
      await client.sendMessage(
        chatId,
        `Story updated: added \`\`\`${text}\`\`\``
      );
      break;
    }
    case "see": {
      const story = (
        await db("story")
          .coll.find({
            chatId,
            ...(Number(args[1]) && { id: Number(args[1]) }),
          })
          .sort({ createdAt: -1 })
          .toArray()
      )?.[0] as Story | null;
      if (story) {
        await client.sendMessage(
          chatId,
          `Story ${Number(args[1]) || 0}:
${story.story.join(" ")}`
        );
      } else {
        await client.sendMessage(chatId, "Story doesn't exist (yet)");
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
          "Word is too long (maximum is 15 characters)"
        );
      }

      await db("story").coll.insertOne(<Story>{
        id: (await db("story").coll.countDocuments({ chatId })) + 1,
        chatId,
        story: [text],
        createdAt: new Date(),
        lastModified: new Date(),
      });

      await client.sendMessage(
        chatId,
        `New story created: \`\`\`${text}\`\`\``
      );
      break;
    }
    case "list": {
      const stories = (await db("story")
        .coll.find({ chatId })
        .sort({ createdAt: -1 })
        .toArray()) as Story[];
      if (!stories.length) {
        return await client.sendMessage(chatId, "No stories created yet");
      }
      await client.sendMessage(
        chatId,
        `Stories:

${stories
  .map((story) => {
    return `${story.id}:
${story.story.filter((_v, i) => i < 10).join(" ")}${
      story.story.length > 10 ? "..." : ""
    }`;
  })
  .join("\n")}`
      );
      break;
    }
    case "remove": {
      if (!msg.fromMe) {
        return await client.sendMessage(chatId, "You cannot remove.");
      }
      await db("story").coll.updateOne(
        {
          chatId,
        },
        { $pop: { story: 1 } }
      );
      await client.sendMessage(chatId, "Last item removed.");
      break;
    }
    default: {
      await client.sendMessage(
        chatId,
        `Use \`\`\`!help todo\`\`\` for syntax.`
      );
      break;
    }
  }
};

module.exports = {
  name: "Story",
  description: "One word story",
  command: "!story",
  commandType: "plugin",
  isDependent: false,
  help: `*Story*\n\n!story add [one word]\n!story new [one word]\n!story see [id]\n!story list\n!story remove`,
  execute,
  public: true,
};
