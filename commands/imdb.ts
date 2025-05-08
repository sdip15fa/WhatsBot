import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
import axios from "../helpers/axios.js";
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import formatNum from "../helpers/formatNum.js";
import processImage from "../helpers/processImage.js";
const { MessageMedia } = whatsapp;
const imdb_host = `https://imdb-api.tprojects.workers.dev`; // no slash at the end

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  const targetLang = await getGroupLanguage(msg);
  try {
    const query = args.join(" ");
    const res = await axios.get(`${imdb_host}/search?query=${query}`);
    const data = res.data;
    if (data.results.length == 0)
      throw new Error(
        getString("imdb.no_results", await getGroupLanguage(msg)),
      );
    let result = data.results[0];

    result = await axios.get(`${imdb_host}${result.api_path}`);
    result = result.data;
    const image = await processImage(result.image);
    const text = `*${result.title}*\n_${
      result.contentType === "Movie"
        ? `${getString("imdb.movie", targetLang)} · ${result.contentRating} · ${
            result.runtime
          } · ${result.year}`
        : result.contentType
    }_\n_*${result.rating.star}* ⭐ - *${formatNum(
      result.rating.count,
    )}* ${getString("imdb.ratings", targetLang)}_\n\n*${getString(
      "imdb.genre",
      targetLang,
    )}:* ${result.genre.join(", ")}\n*${getString("imdb.plot", targetLang)}:* ${
      result.plot
    }\n${result.top_credits
      .map(
        (
          x: { name: string; value: string[] }, // Assuming value is string[] for credits
        ) => `*${x.name}:* ${x.value.join(", ")}`,
      )
      .join("\n")}\n\n*${getString("imdb.link", targetLang)}:* ${result.imdb}`;

    try {
      await client.sendMessage(
        chatId,
        new MessageMedia(image.mimetype, image.data, `${result.title}.jpg`),
        { caption: text },
      );
    } catch (e) {
      console.error("Failed to send IMDB info:", e);
      // await sendLocalized(client, msg, "imdb.send_error");
    }
  } catch (error) {
    await sendLocalized(client, msg, "imdb.error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

const command: Command = {
  name: "IMDB", //name of the module
  description: "imdb.description", // short description of what this command does
  command: "!imdb", //command with prefix. Ex command: '!test'
  commandType: "plugin", // admin|info|plugin
  isDependent: false, //whether this command is related/dependent to some other command
  help: "imdb.help", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  execute,
  public: true,
};

export default command;
