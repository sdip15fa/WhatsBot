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
      .catch(() => null)) || msg;
  if (message.hasMedia) {
    const attachmentData = (await message
      .downloadMedia()
      .then((media) => media)
      .catch(() => null)) as whatsapp.MessageMedia;
    if (!attachmentData) {
      return;
    }

    if (!["video", "image"].includes(attachmentData.mimetype.split("/")[0])) {
      return await client.sendMessage(chatId, "File type incompatible.");
    }

    if (attachmentData.filesize > 1000 * 1000 * 10) {
      return await client.sendMessage(chatId, "File too large.");
    }

    let gif: whatsapp.MessageMedia;

    try {
      gif = await toGIF(attachmentData);
    } catch {
      return await client.sendMessage(
        chatId,
        "Error converting the media to GIF.",
      );
    }

    try {
      await client.sendMessage(chatId, gif);
    } catch {}
  } else {
    await client.sendMessage(
      chatId,
      `🙇‍♂️ *Error*\n\n` + "```No media found to make a GIF image```",
    );
  }
};

const command: Command = {
  name: "GIF Maker",
  description: "generates GIF from media",
  command: "!gif",
  commandType: "plugin",
  isDependent: false,
  help: `*GIF Maker*\n\nCreate GIF from media.\n\nReply a media with *!sticker* to get a sticker of that media.`,
  execute,
  public: true,
};

export default command;
