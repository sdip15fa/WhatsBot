//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;
  const quotedMsg = await msg.getQuotedMessage();
  if (quotedMsg.hasMedia) {
    const attachmentData: whatsapp.MessageMedia = await quotedMsg
      .downloadMedia()
      .then((media) => media)
      .catch(() => null);
    if (!attachmentData) {
      return;
    }
    if (!attachmentData.mimetype.startsWith("audio")) {
      await client.sendMessage(
        chatId,
        `🙇‍♂️ *Error*\n\n` + "```Media is not audio```",
      );
    }

    const result = (await fetch(
      "https://api-inference.huggingface.co/models/wcyat/whisper-small-yue-mdcc",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; rv:122.0) Gecko/20100101 Firefox/122.0",
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.5",
          "content-type": attachmentData.mimetype,
          "x-wait-for-model": "true",
        },
        referrer: "https://huggingface.co/",
        method: "POST",
        mode: "cors",
        body: Buffer.from(attachmentData.data, "base64"),
      },
    ).then((res) => res.json())) as { text: string };

    await client.sendMessage(chatId, `*Transcription*\n\n` + result.text || "");
  } else {
    await client.sendMessage(chatId, `🙇‍♂️ *Error*\n\n` + "```No media found```");
  }
};

const command: Command = {
  name: "Transcribe",
  description: "Transcribe audio",
  command: "!transcribe",
  commandType: "plugin",
  isDependent: false,
  help: `*Transcribe audio*\n\nReply an audio message with !transcribe.`,
  execute,
  public: true,
};

export default command;
