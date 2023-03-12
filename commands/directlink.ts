//jshint esversion:8
import axios from "axios";
const { Axios } = axios;
import FormData from "form-data";
import { Client, Message, MessageMedia } from "whatsapp-web.js";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import mime from "mime-to-extensions";

async function telegraph(attachmentData: MessageMedia) {
  const form = new FormData();
  form.append("file", Buffer.from(attachmentData.data, "base64"), {
    filename: `telegraph.${mime.extension(attachmentData.mimetype)}`,
  });

  return new Axios({
    headers: form.getHeaders(),
  })
    .post("https://telegra.ph/upload", form)
    .then((response) => {
      return "https://telegra.ph" + response.data[0].src;
    })
    .catch(() => {
      return "error";
    });
}
const execute = async (client: Client, msg: Message) => {
  if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    const attachmentData = await quotedMsg
      .downloadMedia()
      .then((media) => media)
      .catch(() => null);
    if (!attachmentData) {
      return;
    }
    const data = await telegraph(attachmentData);
    if (data == "error") {
      quotedMsg.reply(`Error occured while create direct link.`);
    } else {
      quotedMsg.reply(`🔗 *Direct Link 👇*\n\n` + "```" + data + "```");
    }
  } else {
    await client.sendMessage(
      (
        await msg.getChat()
      ).id._serialized,
      "Please reply to a media file"
    );
  }
};

export default {
  name: "Direct Link",
  description:
    "uploads media toh telegra.ph and creates a direct download link",
  command: "!directlink",
  commandType: "plugin",
  isDependent: false,
  help: `*Directlink*\n\nIt will generate photo's directlink for you.\n\nReply a photo with *!directlink* to Create`,
  execute,
  public: true,
};
