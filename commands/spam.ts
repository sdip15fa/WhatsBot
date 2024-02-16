//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
const { MessageMedia } = whatsapp;

const execute = async (client: Client, msg: Message, args: string[]) => {
  const count = Number(args.shift());
  if (isNaN(count)) {
    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Invalid count```");
    return 0;
  }
  if (count <= 0) {
    await client.sendMessage(
      msg.to,
      `🙇‍♂️ *Error*\n\n` + "```Count can't be zero.```",
    );
    return 0;
  }

  if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();

    if (quotedMsg.hasMedia) {
      const media = await quotedMsg
        .downloadMedia()
        .then((media) => media)
        .catch(() => null);
      let sticker = false;
      if (quotedMsg.type == "sticker" && media) sticker = true;

      for (let i = 0; i < count; i++)
        await client.sendMessage(
          msg.to,
          new MessageMedia(media.mimetype, media.data, media.filename),
          { sendMediaAsSticker: sticker },
        );
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
        "```No text found for spamming!!! Please read !help spam.```",
      );
    }
  }
};

const command: Command = {
  name: "Spam",
  description: "spams a certain message for given number of times",
  command: "!spam",
  commandType: "plugin",
  isDependent: false,
  help: `*Spam*\n\nSpam Messages. \n\n*!spam [count text]*\nOR\nreply *!spam [count]* to any message`,
  execute,
  public: false,
};

export default command;
