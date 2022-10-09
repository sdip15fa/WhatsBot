//jshint esversion:8
import { Client, Message, MessageMedia } from "whatsapp-web.js";
import { download } from "../helpers/song";

const execute = async (client: Client, msg: Message, args: string[]) => {
  if (msg.hasQuotedMsg) {
    let quotedMsg = await msg.getQuotedMessage();
    let getdata = await download(args[0], quotedMsg.id.id);
    if (getdata.status && typeof getdata.content !== "string") {
      await client.sendMessage(
        (
          await msg.getChat()
        ).id._serialized,
        new MessageMedia(
          getdata.content.image.mimetype,
          getdata.content.image.data,
          getdata.content.image.filename
        ),
        { caption: getdata.content.text }
      );
    } else if (typeof getdata.content === "string") {
      await client.sendMessage(
        (
          await msg.getChat()
        ).id._serialized,
        getdata.content
      );
    }
  } else {
    await client.sendMessage(
      (
        await msg.getChat()
      ).id._serialized,
      "```Search for the song with !song and then reply to the query result with this command```"
    );
  }
};

module.exports = {
  name: "Download Song",
  description: "Download selected song from the list",
  command: "!dldsong",
  commandType: "plugin",
  isDependent: true,
  help: "use !help song to learn about this command",
  execute,
};
