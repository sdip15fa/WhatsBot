//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
const { MessageMedia } = whatsapp;
import axios from "../helpers/axios.js";
import formatNum from "../helpers/formatNum.js";
import processImage from "../helpers/processImage.js";
import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js"; // Added getGroupLanguage
import { getString } from "../helpers/i18n.js"; // Added getString

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
          null,
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
    await sendLocalized(client, msg, "yt.error");
  } else if (typeof data !== "string" && data.image) {
    // Ensure data.image is not null
    const localizedCaption = getString(
      "yt.success",
      await getGroupLanguage(msg),
      {
        title: data.title,
        views: data.views,
        likes: data.likes,
        comments: data.comments,
      },
    );
    const media = new MessageMedia(
      data.image.mimetype,
      data.image.data,
      data.image.filename,
    );
    try {
      await client.sendMessage(chatId, media, { caption: localizedCaption });
    } catch (e) {
      console.error("Failed to send YouTube info with media:", e);
      // await sendLocalized(client, msg, "yt.send_error");
    }
  } else if (typeof data !== "string" && !data.image) {
    // Handle case where data is valid but image is null (e.g. send text only)
    await sendLocalized(client, msg, "yt.success_no_image", {
      // Assuming a new localization key for this
      title: data.title,
      views: data.views,
      likes: data.likes,
      comments: data.comments,
    });
  }
};

const command: Command = {
  name: "YouTube",
  description: "Get youtube video info",
  command: "!yt",
  commandType: "plugin",
  isDependent: false,
  help: "yt.help",
  execute,
  public: true,
};

export default command;
