//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
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
    await client.sendMessage(
      chatId,
      new MessageMedia(
        attachmentData.mimetype,
        attachmentData.data,
        attachmentData.filename
      ),
      { sendMediaAsSticker: true }
    );
  } else {
    await client.sendMessage(
      chatId,
      `🙇‍♂️ *Error*\n\n` + "```No image found to make a Sticker```"
    );
  }
};

export default {
  name: "Sticker Maker",
  description: "generates sticker from image",
  command: "!sticker",
  commandType: "plugin",
  isDependent: false,
  help: `*Sticker Maker*\n\nCreate sticker from Image.\n\nReply an image with *!sticker* to get a sticker of that image.`,
  execute,
  public: true,
};
