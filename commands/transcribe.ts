//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import axios from "../helpers/axios.js";

interface TranscriptionInfo {
  language: string;
  language_probability: number;
  duration: number;
  duration_after_vad: number;
}

interface Word {
  start: number;
  end: number;
  word: string;
}

interface Segment {
  start: number;
  end: number;
  text: string;
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech: number;
  words: Word[];
}

interface TranscriptionResult {
  transcription_info: TranscriptionInfo;
  segments: Segment[];
  vtt: string;
  text: string;
  word_count: number;
}

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;
  const quotedMsg = await msg.getQuotedMessage();

  if (!config.cf_worker.url) {
    return client.sendMessage(
      chatId,
      "Sorry, cf worker url not specified in the environment variable.",
    );
  }

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

    const username = config.cf_worker.username;
    const password = config.cf_worker.password;

    const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
      "base64",
    );
    const authHeader = `Basic ${encodedCredentials}`;

    const result = await axios.post<TranscriptionResult>(
      config.cf_worker.url,
      Buffer.from(attachmentData.data, "base64"),
      {
        headers: {
          "Content-Type": attachmentData.mimetype,
          Authorization: authHeader,
        },
      },
    );

    await client.sendMessage(
      chatId,
      `*Transcription*\n\n` + (result.data.text || ""),
    );
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
