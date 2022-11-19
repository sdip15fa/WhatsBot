//jshint esversion:8
import axios from "axios";
import FormData from "form-data";
import { Client, Message, MessageMedia } from "whatsapp-web.js";
let mime = require("mime-to-extensions");

async function telegraph(attachmentData: MessageMedia) {
  let form = new FormData();
  form.append("file", Buffer.from(attachmentData.data, "base64"), {
    filename: `telegraph.${mime.extension(attachmentData.mimetype)}`,
  });

  return axios
    .create({
      headers: form.getHeaders(),
    })
    .post("https://telegra.ph/upload", form)
    .then((response) => {
      return "https://telegra.ph" + response.data[0].src;
    })
    .catch((error) => {
      return "error";
    });
}
const execute = async (client: Client, msg: Message) => {
  if (msg.hasQuotedMsg) {
    let quotedMsg = await msg.getQuotedMessage();
    let attachmentData = await quotedMsg
      .downloadMedia()
      .then((media) => media)
      .catch(() => null);
    if (!attachmentData) {
      return;
    }
    let data = await telegraph(attachmentData);
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

module.exports = {
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
