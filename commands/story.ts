//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import db from "../db";
import Story from "../models/story";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  switch (args[0]) {
    case "add": {
      const text = args[1];
      if (
        !(
          await db("story").coll.updateOne(
            { chatId },
            { $push: { story: text } }
          )
        ).matchedCount
      ) {
        await db("story").coll.insertOne(<Story>{ chatId, story: [text] });
      }
      await client.sendMessage(chatId, `Story updated: added ${text}`);
    }
    case "see": {
      const story = (await db("story").coll.findOne({
        chatId,
      })) as Story | null;
      if (story) {
        await client.sendMessage(
          chatId,
          `Current story:
${story.story.join(" ")}`
        );
      } else {
        await client.sendMessage(chatId, "Story doesn't exist (yet)");
      }
    }
    default: {
      await client.sendMessage(
        chatId,
        `Syntax:
          !story add [one word]
          !story see`
      );
    }
  }
};

module.exports = {
  name: "Story",
  description: "Add words / view story",
  command: "!story",
  commandType: "plugin",
  isDependent: false,
  help: `*Story*\n\nAdd words / view story.\n\n!story add [one word]\n\n!story see`,
  execute,
  public: true,
};
