import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
const { MessageMedia } = whatsapp;

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;
  const message: Message =
    (await msg
      .getQuotedMessage()
      .then((msg) => msg)
      .catch((): null => null)) || msg; // Explicit return type
  if (message.hasMedia) {
    const attachmentData = await message
      .downloadMedia()
      .then((media) => media)
      .catch((): null => null); // Explicit return type
    if (!attachmentData) {
      return;
    }
    try {
      await client.sendMessage(
        chatId,
        new MessageMedia(
          attachmentData.mimetype,
          attachmentData.data,
          attachmentData.filename,
        ),
        { sendMediaAsSticker: true },
      );
    } catch {
      await client.sendMessage(
        chatId,
        getString("sticker.send_failed", await getGroupLanguage(msg)),
      );
    }
  } else {
    await client.sendMessage(
      chatId,
      getString("sticker.no_image", await getGroupLanguage(msg)),
    );
  }
};

const command: Command = {
  name: "Sticker Maker",
  description: "sticker.description",
  command: "!sticker",
  commandType: "plugin",
  isDependent: false,
  help: "sticker.help",
  execute,
  public: true,
};

export default command;
