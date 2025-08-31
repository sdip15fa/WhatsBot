import { sendLocalized } from "../helpers/localizedMessenger.js";
//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
const { MessageMedia } = whatsapp;

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;

  // Check if there's a quoted message first
  if (!msg.hasQuotedMsg) {
    await sendLocalized(client, msg, "media.no_media");
    return;
  }

  const quotedMsg = await msg.getQuotedMessage();

  // Check if the quoted message has media
  if (!quotedMsg.hasMedia) {
    await sendLocalized(client, msg, "media.no_media");
    return;
  }

  const attachmentData = await quotedMsg
    .downloadMedia()
    .then((media) => media)
    .catch((): null => null); // Explicit return type for catch

  if (!attachmentData) {
    await sendLocalized(client, msg, "media.send_error");
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
    );
  } catch (e) {
    console.error("Failed to send media:", e);
    await sendLocalized(client, msg, "media.send_error");
  }
};

const command: Command = {
  name: "Get media",
  description: "media.description",
  command: "!media",
  commandType: "plugin",
  isDependent: false,
  help: "media.help",
  execute,
  public: true,
};

export default command;
