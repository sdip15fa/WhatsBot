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
      } catch {}
    } else if (typeof getdata.content === "string") {
      await client.sendMessage(chatId, getdata.content);
    }
  } else {
    await client.sendMessage(
      chatId,
      "```Search for the song with !song and then reply to the query result with this command```",
    );
  }
};

const command: Command = {
  name: "Download Song",
  description: "Download selected song from the list",
  command: "!dldsong",
  commandType: "plugin",
  isDependent: true,
  help: "use !help song to learn about this command",
  execute,
  public: true,
};

export default command;
