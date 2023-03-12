//jshint esversion:8
import { ocrSpace } from "ocr-space-api-wrapper";
import { Client, Message, MessageMedia } from "whatsapp-web.js";
import config from "../config.js";

async function readImage(attachmentData: MessageMedia) {
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
  if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    const attachmentData = await quotedMsg
      .downloadMedia()
      .then((media) => media)
      .catch(() => null);
    if (!attachmentData) return;
    const data = await readImage(attachmentData);
    if (data == "error") {
      quotedMsg.reply(
        `Error occured while reading the image. Please make sure the image is clear.`
      );
    } else if (typeof data !== "string") {
      quotedMsg.reply(
        `*Extracted Text from the Image*  👇\n\n${data.parsedText}`
      );
    }
  } else {
    await client.sendMessage(
      (
        await msg.getChat()
      ).id._serialized,
      "```Please reply to an image with text in it```"
    );
  }
};

export default {
  name: "OCR",
  description: "Extracts text content from given image",
  command: "!ocr",
  commandType: "plugin",
  isDependent: false,
  help: `*OCR*\n\nReads text from any readable image. \n\n*Reply a photo with !ocr to read text from that image.*\n`,
  execute,
  public: true,
};
