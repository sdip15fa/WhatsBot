//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { client as gradio } from "@gradio/client";

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
    const app = await gradio("https://openai-whisper.hf.space/", {});
    const result = (await app.predict("/predict", [
      attachmentData.data, // blob in 'inputs' Audio component
      "transcribe", // string  in 'Task' Radio component
    ])) as { data: string[] };
    await client.sendMessage(
      chatId,
      `*Transcription*\n\n` + result.data?.[0] || "",
    );
  } else {
    await client.sendMessage(chatId, `🙇‍♂️ *Error*\n\n` + "```No media found```");
  }
};

export default {
  name: "Transcribe",
  description: "Transcribe audio",
  command: "!transcribe",
  commandType: "plugin",
  isDependent: false,
  help: `*Transcribe audio*\n\nReply an audio message with !transcribe.`,
  execute,
  public: true,
};
