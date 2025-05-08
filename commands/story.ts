import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
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
        return await sendLocalized(client, msg, "story.add.no_word");
      }
      if (text.length > 15) {
        return await sendLocalized(client, msg, "story.add.word_too_long");
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
          return await sendLocalized(client, msg, "story.not_found");
        } else {
          return await client.sendMessage(
            chatId,
            getString("story.add.success", await getGroupLanguage(msg), {
              word: text,
            }),
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
        const newStory: Story = {
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
        };
        await db("story").coll.insertOne(newStory);
      }
      await client.sendMessage(
        chatId,
        getString("story.add.success", await getGroupLanguage(msg), {
          word: text,
        }),
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
          getString("story.see.success", await getGroupLanguage(msg), {
            id: Number(args[1])
              ? Number(args[1])
              : getString(
                  "story.see.current_label",
                  await getGroupLanguage(msg),
                ),
            content: story.story.join(" "),
          }),
        );
      } else {
        await sendLocalized(client, msg, "story.not_found");
      }
      break;
    }
    case "new": {
      const text = args[1];
      if (!text) {
        return await sendLocalized(client, msg, "story.new.no_word");
      }
      if (text.length > 15) {
        return await sendLocalized(client, msg, "story.new.word_too_long");
      }

      await db("story").coll.updateMany(
        { chatId },
        { $set: { current: false } },
      );

      const newStoryFromNewCommand: Story = {
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
      };
      await db("story").coll.insertOne(newStoryFromNewCommand);

      await client.sendMessage(
        chatId,
        getString("story.new.success", await getGroupLanguage(msg), {
          word: text,
        }),
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
        return await sendLocalized(client, msg, "story.list.no_stories");
      }
      const targetLang = await getGroupLanguage(msg);
      await client.sendMessage(
        // Removed duplicate client.sendMessage
        chatId,
        getString("story.list.success", targetLang, {
          stories: stories
            .map((story) => {
              return `${story.id}${
                story.current
                  ? getString("story.list.current_label", targetLang)
                  : ""
              }:\n${getString("story.list.created", targetLang)}: ${new Date(
                story.createdAt,
              ).toLocaleString("en-UK", {
                timeZone: process.env.TZ,
              })}\n${getString(
                "story.list.last_modified",
                targetLang,
              )}: ${new Date(story.lastModified).toLocaleString("en-UK", {
                timeZone: process.env.TZ,
              })}\n${getString("story.list.content", targetLang)}: ${story.story
                .filter((_v, i) => i < 10)
                .join(" ")}${story.story.length > 10 ? "..." : ""}`;
            })
            .join("\n\n"),
        }),
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
            getString("story.current.success", await getGroupLanguage(msg), {
              id: Number(args[1]),
            }),
          );
        } else {
          await sendLocalized(client, msg, "story.not_found");
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
          id
            ? getString("story.current.status", await getGroupLanguage(msg), {
                id: id,
              })
            : getString("story.list.no_stories", await getGroupLanguage(msg)),
        );
      }
      break;
    }
    case "pop": {
      if (!msg.fromMe) {
        return await sendLocalized(client, msg, "story.owner_only");
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
          getString("story.pop.nothing_removed", await getGroupLanguage(msg)),
        );
      }
      await sendLocalized(client, msg, "story.pop.success");
      break;
    }
    case "remove": {
      if (!msg.fromMe) {
        return await sendLocalized(client, msg, "story.remove.not_allowed");
      }
      if (
        !(await db("story").coll.deleteOne({ chatId, id: Number(args[1]) }))
          .deletedCount
      ) {
        return await sendLocalized(client, msg, "story.remove.nothing_removed");
      }
      await sendLocalized(client, msg, "story.remove.success", {
        id: Number(args[1]),
      });
      break;
    }
    default: {
      await client.sendMessage(
        chatId,
        getString("story.help_syntax", await getGroupLanguage(msg)),
      );
      break;
    }
  }
};

const command: Command = {
  name: "Story",
  description: "story.description",
  command: "!story",
  commandType: "plugin",
  isDependent: false,
  help: "story.help",
  execute,
  public: true,
};

export default command;
