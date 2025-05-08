//jshint esversion:8

//TODO: fix it
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import axios from "../helpers/axios.js";
import {
  sendLocalized,
  getGroupLanguage,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
const { MessageMedia } = whatsapp;

async function carbon(text: string) {
  const respoimage = await axios
    .get<ArrayBuffer>(
      `https://carbonnowsh.herokuapp.com/?code=${text.replace(
        / /gi,
        "+",
      )}&theme=darcula&backgroundColor=rgba(36, 75, 115)`,
      { responseType: "arraybuffer" },
    )
    .catch((): null => null);

  if (!respoimage) {
    return null;
  }

  return {
    mimetype: "image/png",
    data: Buffer.from(respoimage.data).toString("base64"),
    filename: "carbon",
  };
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  let data;
  let textToCarbon = args.join(" ");

  if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    textToCarbon = quotedMsg.body;
    data = await carbon(textToCarbon);
  } else {
    data = await carbon(textToCarbon);
  }

  if (!data) {
    await sendLocalized(client, msg, "carbon.error");
  } else {
    try {
      const userLanguage = await getGroupLanguage(msg);
      const caption = getString("carbon.caption", userLanguage, {
        text: textToCarbon,
      });
      await client.sendMessage(
        msg.to,
        new MessageMedia(data.mimetype, data.data, data.filename),
        {
          caption: caption,
        },
      );
    } catch (e) {
      console.error("Failed to send carbon image:", e);
      // Optionally, send a localized error message to the user
      // await sendLocalized(client, msg, "carbon.send_error");
    }
  }
};

const command: Command = {
  name: "carbon.name",
  description: "carbon.description",
  command: "!carbon",
  commandType: "plugin",
  isDependent: false,
  help: "carbon.help",
  execute,
  public: true,
};

export default command;
