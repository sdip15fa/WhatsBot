//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
const { MessageMedia } = whatsapp;

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;
  const quotedMsg = await msg.getQuotedMessage();
  if (quotedMsg.hasMedia) {
    const attachmentData = await quotedMsg
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
        attachmentData.filename,
      ),
    );
  } else {
    await client.sendMessage(chatId, `🙇‍♂️ *Error*\n\n` + "```No media found```");
  }
};

const command: Command = {
  name: "Get media",
  description: "Get media from message",
  command: "!media",
  commandType: "plugin",
  isDependent: false,
  help: `*Get media*\n\nGet media from message (especially stickers)\n\nReply a message with *!media* to get the media of that message.`,
  execute,
  public: true,
};

export default command;
