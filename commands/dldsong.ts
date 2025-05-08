import { sendLocalized } from "../helpers/localizedMessenger.js";
//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
const { MessageMedia } = whatsapp;
import { download } from "../helpers/song.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    const getdata = await download(args[0], quotedMsg.id.id);
    if (getdata.status && typeof getdata.content !== "string") {
      try {
        await client.sendMessage(
          chatId,
          new MessageMedia(
            getdata.content.image.mimetype,
            getdata.content.image.data,
            getdata.content.image.filename,
          ),
          { caption: getdata.content.text },
        );
      } catch (e) {
        console.error("Failed to send song with media:", e);
        // Optionally send a localized error to the user
        // await sendLocalized(client, msg, "dldsong.send_error");
      }
    } else if (typeof getdata.content === "string") {
      await sendLocalized(client, msg, "dldsong.error", {
        error: getdata.content,
      });
    }
  } else {
    await sendLocalized(client, msg, "dldsong.no_quoted_msg");
  }
};

const command: Command = {
  name: "Download Song",
  description: "dldsong.description",
  command: "!dldsong",
  commandType: "plugin",
  isDependent: true,
  help: "dldsong.help",
  execute,
  public: true,
};

export default command;
