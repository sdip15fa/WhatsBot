import { sendLocalized } from "../helpers/localizedMessenger.js";
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
      .catch((): null => null); // Explicit return type for catch
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
      );
    } catch (e) {
      console.error("Failed to send media:", e);
      // await sendLocalized(client, msg, "media.send_error");
    }
  } else {
    await sendLocalized(client, msg, "media.no_media");
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
