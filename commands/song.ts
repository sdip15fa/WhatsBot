import { Client, Message } from "whatsapp-web.js";

//jshint esversion:8
import fs from "fs";
import path from "path";
import { search } from "../helpers/song";

const execute = async (client: Client, msg: Message, args: string[]) => {
  let getdata = await search(args.join(" "));
  let sendmessage = await client.sendMessage(
    (
      await msg.getChat()
    ).id._serialized,
    getdata.content
  ); // have to grab the message ID
  if (getdata.status) {
    fs.writeFileSync(
      path.join(__dirname, `../cache/song~${sendmessage.id.id}.json`),
      JSON.stringify(getdata.songarray)
    );
  }
};

module.exports = {
  name: "Search Song",
  description: "Search songs on jiosaavn",
  command: "!song",
  commandType: "plugin",
  isDependent: false,
  help: `*Song*\n\nSearch a song and download it. \n\n*!song [search-query]*\nEx: !song makhna\n\nThen reply the message with *!dldsong [id]*\nEx. !dldsong 1`,
  execute,
  public: true,
};
