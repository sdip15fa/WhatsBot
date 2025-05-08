import { sendLocalized } from "../helpers/localizedMessenger.js";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

//jshint esversion:8
import fs from "fs";
import path, { dirname } from "path"; // Import dirname
import { fileURLToPath } from "url"; // Import fileURLToPath
import { search } from "../helpers/song.js";

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execute = async (client: Client, msg: Message, args: string[]) => {
  const getdata = await search(args.join(" "));
  const sendmessage = await sendLocalized(client, msg, "song.search_result", {
    content: getdata.content,
  }); // have to grab the message ID
  if (getdata.status && sendmessage) {
    fs.writeFileSync(
      path.join(__dirname, `../cache/song~${sendmessage.id.id}.json`),
      JSON.stringify(getdata.songarray),
    );
  }
};

const command: Command = {
  name: "Search Song",
  description: "song.description",
  command: "!song",
  commandType: "plugin",
  isDependent: false,
  help: "song.help",
  execute,
  public: true,
};

export default command;
