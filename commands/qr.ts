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
      { caption: `QR code for 👇\n` + "```" + msg.body + "```" },
    );
  } catch {}
};

const command: Command = {
  name: "QR generator",
  description: "Generates QR for given text",
  command: "!qr",
  commandType: "plugin",
  isDependent: false,
  help: "`*QR generator*\n\nGenerate QR code with this module. Just send the text it will generate QR Code image for you.\n\n*!qr [Text]*\nor,\nReply a message with *!qr* to Create`",
  execute,
  public: true,
};

export default command;
