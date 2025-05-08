import { getGroupLanguage } from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
//jshint esversion:8
import { ocrSpace } from "ocr-space-api-wrapper";
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";

async function readImage(attachmentData: whatsapp.MessageMedia) {
  try {
    const res = await ocrSpace(`data:image/png;base64,${attachmentData.data}`, {
      apiKey: `${config.ocr_space_api_key}`,
    });
    const parsedText = res.ParsedResults[0].ParsedText;
    const out = {
      parsedText: parsedText,
    };
    return out;
  } catch (error) {
    return "error";
  }
}

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;
  if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    const attachmentData = await quotedMsg
      .downloadMedia()
      .then((media) => media)
      .catch(() => null as any);
    if (!attachmentData) return;
    const data = await readImage(attachmentData);
    if (data == "error") {
      await client.sendMessage(
        chatId,
        getString("ocr.read_error", await getGroupLanguage(msg)),
      );
    } else if (typeof data !== "string") {
      await client.sendMessage(
        chatId,
        getString("ocr.success", await getGroupLanguage(msg), {
          text: data.parsedText,
        }),
      );
    }
  } else {
    await client.sendMessage(
      (await msg.getChat()).id._serialized,
      getString("ocr.no_image", await getGroupLanguage(msg)),
    );
  }
};

const command: Command = {
  name: "OCR",
  description: "ocr.description",
  command: "!ocr",
  commandType: "plugin",
  isDependent: false,
  help: "ocr.help",
  execute,
  public: true,
};

export default command;
