//jshint esversion:8
import { Client, Message, MessageMedia } from "whatsapp-web.js";

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;
  let quotedMsg = await msg.getQuotedMessage();
  if (quotedMsg.hasMedia) {
    let attachmentData = await quotedMsg
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
      )
    );
  } else {
    await client.sendMessage(chatId, `🙇‍♂️ *Error*\n\n` + "```No media found```");
  }
};

module.exports = {
  name: "Get media",
  description: "Get media from message",
  command: "!media",
  commandType: "plugin",
  isDependent: false,
  help: `*Get media*\n\nGet media from message (especially stickers)\n\nReply a message with *!media* to get the media of that message.`,
  execute,
  public: true,
};
