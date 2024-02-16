import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

//jshint esversion:8
import fs from "fs";
import path from "path";
import { search } from "../helpers/song.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const getdata = await search(args.join(" "));
  const sendmessage = await client.sendMessage(
    (await msg.getChat()).id._serialized,
    getdata.content,
  ); // have to grab the message ID
  if (getdata.status) {
    fs.writeFileSync(
      path.join(__dirname, `../cache/song~${sendmessage.id.id}.json`),
      JSON.stringify(getdata.songarray),
    );
  }
};

const command: Command = {
  name: "Search Song",
  description: "Search songs on jiosaavn",
  command: "!song",
  commandType: "plugin",
  isDependent: false,
  help: `*Song*\n\nSearch a song and download it. \n\n*!song [search-query]*\nEx: !song makhna\n\nThen reply the message with *!dldsong [id]*\nEx. !dldsong 1`,
  execute,
  public: true,
};

export default command;
