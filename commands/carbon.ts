//jshint esversion:8

//TODO: fix it
import { Client, Message, MessageMedia } from "whatsapp-web.js";
import axios from "axios";

async function carbon(text: string) {
  const respoimage = await axios
    .get<ArrayBuffer>(
      `https://carbonnowsh.herokuapp.com/?code=${text.replace(
        / /gi,
        "+"
      )}&theme=darcula&backgroundColor=rgba(36, 75, 115)`,
      { responseType: "arraybuffer" }
    )
    .catch(() => {
      return null;
    });

  if (!respoimage) {
    return null;
  }

  return {
    mimetype: "image/png",
    data: Buffer.from(respoimage.data).toString("base64"),
    filename: "carbon",
  };
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  let data;

  if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    data = await carbon(quotedMsg.body);
    msg = quotedMsg;
  } else {
    data = await carbon(args.join(" "));
  }

  if (!data) {
    await client.sendMessage(
      msg.to,
      `🙇‍♂️ *Error*\n\n` +
        "```Something Unexpected Happened to create the Carbon.```"
    );
  } else {
    await client.sendMessage(
      msg.to,
      new MessageMedia(data.mimetype, data.data, data.filename),
      {
        caption:
          `Carbon for 👇\n` + "```" + msg.body.replace("!carbon ", "") + "```",
      }
    );
  }
};

module.exports = {
  name: "Carbon",
  description: "Creates a carbon.now.sh image from text",
  command: "!carbon",
  commandType: "plugin",
  isDependent: false,
  help: `*Carbon*\n\nGenerate beautiful image with carbon.now.sh. Just send the text it will generate an image for you.\n\n*!carbon [Text]*\nor,\nReply a message with *!carbon* to Create`,
  execute,
};
