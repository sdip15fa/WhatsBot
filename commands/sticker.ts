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
      .catch(() => null)) || msg;
  if (message.hasMedia) {
    const attachmentData = await message
      .downloadMedia()
      .then((media) => media)
      .catch(() => null);
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
      await client.sendMessage(chatId, "Sending sticker failed.");
    }
  } else {
    await client.sendMessage(
      chatId,
      `🙇‍♂️ *Error*\n\n` + "```No image found to make a Sticker```",
    );
  }
};

const command: Command = {
  name: "Sticker Maker",
  description: "generates sticker from image",
  command: "!sticker",
  commandType: "plugin",
  isDependent: false,
  help: `*Sticker Maker*\n\nCreate sticker from Image.\n\nReply an image with *!sticker* to get a sticker of that image.`,
  execute,
  public: true,
};

export default command;
