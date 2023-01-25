//jshint esversion:8
import { Client, Message, MessageMedia } from "whatsapp-web.js";
import axios from "axios";
import formatNum from "../helpers/formatNum";
import processImage from "../helpers/processImage";

async function youtube(url: string) {
  try {
    const data = (
      await axios.get(`https://yoothoob.vercel.app/fromLink?link=${url}`)
    )?.data;
    if (!data) return "error";
    return {
      title: data.title,
      likes: formatNum(data.stats.likes),
      views: formatNum(data.stats.views),
      comments: formatNum(data.stats.comments),
      image: await processImage(
        data.images[3] ||
          data.images[2] ||
          data.images[1] ||
          data.images[0] ||
          null
      ),
    };
  } catch (error) {
    return "error";
  }
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  let data;

  if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    data = await youtube(quotedMsg.body);
  } else {
    data = await youtube(args[0]);
  }

  if (data == "error") {
    await client.sendMessage(
      chatId,
      `🙇‍♂️ *Error*\n\n` +
        "```Something Unexpected Happened to fetch the YouTube video```"
    );
  } else if (typeof data !== "string") {
    await client.sendMessage(
      chatId,
      new MessageMedia(
        data.image.mimetype,
        data.image.data,
        data.image.filename
      ),
      {
        caption:
          `*${data.title}*\n\nViews: ` +
          "```" +
          data.views +
          "```\nLikes: " +
          "```" +
          data.likes +
          "```\nComments: " +
          "```" +
          data.comments,
      }
    );
  }
};

module.exports = {
  name: "YouTube",
  description: "Get youtube video info",
  command: "!yt",
  commandType: "plugin",
  isDependent: false,
  help: `*Youtube*\n\nGet info of a Youtube video with this command.\n\n*!yt [Youtube-Link]*\nor,\nReply a message with *!yt* to get info.`,
  execute,
  public: true,
};
