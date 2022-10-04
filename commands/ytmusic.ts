//jshint esversion:8
import { Client, Message, MessageMedia } from "whatsapp-web.js";
import axios from "axios";
import formatNum from "../helpers/formatNum";
import processImage from "../helpers/processImage";
import { getShortURL } from "../commands/shorten";

async function youtube(url: string) {
  try {
    let data = (
      await axios.get(`https://yoothoob.vercel.app/fromLink?link=${url}`)
    ).data;
    let shortUrl = await getShortURL(data.assets.mp3);
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
      download_link:
        typeof shortUrl === "string" ? data.assets.mp3 : shortUrl.short,
    };
  } catch (error) {
    return "error";
  }
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  let data;

  msg.delete(true);

  if (msg.hasQuotedMsg) {
    let quotedMsg = await msg.getQuotedMessage();
    data = await youtube(quotedMsg.body);
  } else {
    data = await youtube(args[0]);
  }

  if (data == "error") {
    await client.sendMessage(
      (
        await msg.getChat()
      ).id._serialized,
      `🙇‍♂️ *Error*\n\n` +
        "```Something Unexpected Happened to fetch the YouTube video```"
    );
  } else if (typeof data !== "string") {
    await client.sendMessage(
      (
        await msg.getChat()
      ).id._serialized,
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
          data.comments +
          "```\n\n*Download Mp3* 👇\n" +
          "```" +
          data.download_link +
          "```",
      }
    );
  }
};

module.exports = {
  name: "YouTube Music",
  description: "Download mp3 from a Youtube Link",
  command: "!ytmusic",
  commandType: "plugin",
  isDependent: false,
  help: `*Youtube Music*\n\nDownload mp3 from a Youtube Link with this command.\n\n*!ytmusic [Youtube-Link]*\nor,\nReply a youtube link with *!ytmusic*`,
  execute,
};
