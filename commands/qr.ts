import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
const { MessageMedia } = whatsapp;
import qr from "qr-image";

async function qrgen(text: string) {
  const data = {
    mimetype: "image/png",
    data: await qr.imageSync(text, { type: "png" }).toString("base64"),
    filename: text + ".png",
  };
  return data;
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  let data;

  if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    data = await qrgen(quotedMsg.body);
    msg = quotedMsg;
  } else {
    data = await qrgen(args.join(" "));
  }

  try {
    await client.sendMessage(
      (await msg.getChat()).id._serialized,
      new MessageMedia(data.mimetype, data.data, data.filename),
      {
        caption: getString("qr.caption", await getGroupLanguage(msg), {
          text: msg.body,
        }),
      },
    );
  } catch (e) {
    console.error("Failed to send QR code:", e);
    // await sendLocalized(client, msg, "qr.send_error");
  }
};

const command: Command = {
  name: "QR generator",
  description: "qr.description",
  command: "!qr",
  commandType: "plugin",
  isDependent: false,
  help: "qr.help",
  execute,
  public: true,
};

export default command;
