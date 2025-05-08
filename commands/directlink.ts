import { sendLocalized } from "../helpers/localizedMessenger.js";
//jshint esversion:8
import FormData from "form-data";
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import mime from "mime-to-extensions";
import axios from "../helpers/axios.js";

async function telegraph(attachmentData: whatsapp.MessageMedia) {
  const form = new FormData();
  const extension = mime.extension(attachmentData.mimetype) || "bin"; // Default to 'bin' if extension not found
  form.append("file", Buffer.from(attachmentData.data, "base64"), {
    filename: `telegraph.${extension}`,
  });

  return await axios
    .post("https://telegra.ph/upload", form, { headers: form.getHeaders() })
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
      .catch((): null => null); // Explicitly type the return value of catch
    if (!attachmentData) {
      return;
    }
    const data = await telegraph(attachmentData);
    if (data == "error") {
      sendLocalized(client, quotedMsg, "directlink.error");
    } else {
      sendLocalized(client, quotedMsg, "directlink.success", { link: data });
    }
  } else {
    await sendLocalized(client, msg, "directlink.no_media");
  }
};

const command: Command = {
  name: "Direct Link",
  description: "directlink.description",
  command: "!directlink",
  commandType: "plugin",
  isDependent: false,
  help: "directlink.help",
  execute,
  public: true,
};

export default command;
