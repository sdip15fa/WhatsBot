//jshint esversion:8
import { Client, Message, MessageMedia } from "whatsapp-web.js";

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;
  let message: Message =
    (await msg
      .getQuotedMessage()
      .then((msg) => msg)
      .catch(() => null)) || msg;
  if (message.hasMedia) {
    let attachmentData = await message
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

module.exports = {
  name: "Sticker Maker",
  description: "generates sticker from image",
  command: "!sticker",
  commandType: "plugin",
  isDependent: false,
  help: `*Sticker Maker*\n\nCreate sticker from Image.\n\nReply an image with *!sticker* to get a sticker of that image.`,
  execute,
  public: true,
};
