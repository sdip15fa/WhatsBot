import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
const { MessageMedia } = whatsapp;

const execute = async (client: Client, msg: Message, args: string[]) => {
  const count = Number(args.shift());
  if (isNaN(count)) {
    await client.sendMessage(
      msg.to,
      getString("spam.invalid_count", await getGroupLanguage(msg)),
    );
    return 0;
  }
  if (count <= 0) {
    await client.sendMessage(
      msg.to,
      getString("spam.zero_count", await getGroupLanguage(msg)),
    );
    return 0;
  }

  if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();

    if (quotedMsg.hasMedia) {
      const media = await quotedMsg
        .downloadMedia()
        .then((media) => media)
        .catch((): null => null); // Explicit return type for catch
      let sticker = false;
      if (quotedMsg.type == "sticker" && media) sticker = true;

      for (let i = 0; i < count; i++) {
        try {
          await client.sendMessage(
            msg.to,
            new MessageMedia(media.mimetype, media.data, media.filename),
            { sendMediaAsSticker: sticker },
          );
        } catch (e) {
          console.error("Failed to send spam message with media:", e);
          // Optionally, add a small delay here if sending too fast causes issues
          // await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } else {
      for (let i = 0; i < count; i++)
        await client.sendMessage(msg.to, quotedMsg.body);
    }
  } else {
    if (args.length) {
      const text = args.join(" ");
      for (let i = 0; i < count; i++) await client.sendMessage(msg.to, text);
    } else {
      await client.sendMessage(
        msg.to,
        getString("spam.no_text", await getGroupLanguage(msg)),
      );
    }
  }
};

const command: Command = {
  name: "Spam",
  description: "spam.description",
  command: "!spam",
  commandType: "plugin",
  isDependent: false,
  help: "spam.help",
  execute,
  public: false,
};

export default command;
