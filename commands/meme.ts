//jshint esversion:6

import { Client, Message, MessageMedia } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const subreddit = args[0] || "memes";

  try {
    const response = await fetch(
      `https://meme-api.com/gimme/${subreddit}`
    );

    if (!response.ok) {
      await sendLocalized(client, msg, "meme.error");
      return;
    }

    const data = await response.json();

    if (!data.url) {
      await sendLocalized(client, msg, "meme.not_found");
      return;
    }

    // Download the meme
    const imageResponse = await fetch(data.url);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    const media = new MessageMedia(
      data.url.endsWith(".gif") ? "image/gif" : "image/jpeg",
      base64,
      "meme"
    );

    const caption = `*${data.title}*\n\n👍 ${data.ups} upvotes\n📱 r/${data.subreddit}\n👤 u/${data.author}`;

    await msg.reply(media, undefined, { caption });
  } catch (error) {
    console.error("Error fetching meme:", error);
    await sendLocalized(client, msg, "meme.error");
  }
};

const command: Command = {
  name: "Meme",
  description: "Get random meme from Reddit",
  command: "!meme",
  commandType: "plugin",
  isDependent: false,
  help: undefined,
  execute,
  public: true,
};

export default command;
