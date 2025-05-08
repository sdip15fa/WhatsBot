import { sendLocalized } from "../helpers/localizedMessenger.js";
//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { toGIF } from "../helpers/togif.js";

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;
  const message: Message =
    (await msg
      .getQuotedMessage()
      .then((msg) => msg)
      .catch((): null => null)) || msg; // Explicit return type for catch
  if (message.hasMedia) {
    const attachmentData = (await message
      .downloadMedia()
      .then((media) => media)
      .catch((): null => null)) as whatsapp.MessageMedia; // Explicit return type for catch
    if (!attachmentData) {
      return;
    }

    if (!["video", "image"].includes(attachmentData.mimetype.split("/")[0])) {
      return await sendLocalized(client, msg, "gif.incompatible_type");
    }

    if (attachmentData.filesize > 1000 * 1000 * 10) {
      return await sendLocalized(client, msg, "gif.file_too_large");
    }

    let gif: whatsapp.MessageMedia;

    try {
      gif = await toGIF(attachmentData);
    } catch {
      return await sendLocalized(client, msg, "gif.conversion_error");
    }

    try {
      await client.sendMessage(chatId, gif);
    } catch (e) {
      console.error("Failed to send GIF:", e);
      // Optionally send a localized error message
      // await sendLocalized(client, msg, "gif.send_error");
    }
  } else {
    await sendLocalized(client, msg, "gif.no_media");
  }
};

const command: Command = {
  name: "GIF Maker",
  description: "gif.description",
  command: "!gif",
  commandType: "plugin",
  isDependent: false,
  help: "gif.help",
  execute,
  public: true,
};

export default command;
