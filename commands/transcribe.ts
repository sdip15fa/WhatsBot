//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import axios from "../helpers/axios.js";
import FormData from "form-data";
import mime from "mime-to-extensions";
import { sendLocalized } from "../helpers/localizedMessenger.js";

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
    return sendLocalized(client, msg, "transcribe.cf_worker_url_not_specified");
  }

  if (quotedMsg.hasMedia) {
    const attachmentData: whatsapp.MessageMedia = await quotedMsg
      .downloadMedia()
      .then((media) => media)
      .catch((): null => null); // Already has explicit null, this is fine.
    if (!attachmentData) {
      return;
    }
    if (!attachmentData.mimetype.startsWith("audio")) {
      await sendLocalized(client, msg, "transcribe.media_not_audio");
    }

    const username = config.cf_worker.username;
    const password = config.cf_worker.password;

    const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
      "base64",
    );
    const authHeader = `Basic ${encodedCredentials}`;

    const form = new FormData();
    form.append("audio", Buffer.from(attachmentData.data, "base64"), {
      filename: `audio.${mime.extension(attachmentData.mimetype)}`,
    });

    const result = await axios.post<TranscriptionResult>(
      config.cf_worker.url,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: authHeader,
        },
      },
    );

    await sendLocalized(client, msg, "transcribe.success", {
      text: result.data.text || "",
    });
  } else {
    await sendLocalized(client, msg, "transcribe.no_media");
  }
};

const command: Command = {
  name: "Transcribe",
  description: "Transcribe audio",
  command: "!transcribe",
  commandType: "plugin",
  isDependent: false,
  help: "transcribe.help",
  execute,
  public: true,
};

export default command;
