// Import necessary modules and dependencies
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import axios from "../helpers/axios.js";
const { MessageMedia } = whatsapp;

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (!config.cf_worker.url) {
    return client.sendMessage(
      chatId,
      "Sorry, cf worker url not specified in the environment variable.",
    );
  }

  // Extract the text from the user's message
  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());

  if (!args.length && !quotedMsg.body) {
    return client.sendMessage(chatId, "Please provide a prompt!");
  }

  const prompt = args.join(" ") || quotedMsg.body;

  const username = config.cf_worker.username;
  const password = config.cf_worker.password;

  const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
    "base64",
  );
  const authHeader = `Basic ${encodedCredentials}`;

  try {
    // Call Llama model with the obtained text
    const image = await axios
      .get(`${config.cf_worker.url}sd`, {
        params: {
          prompt,
        },
        headers: {
          Authorization: authHeader,
        },
        responseType: "arraybuffer",
      })
      .then((response) =>
        Buffer.from(response.data, "binary").toString("base64"),
      );

    const media = new MessageMedia("image/png", image);
    // Send the response back to the user
    try {
      await msg.reply(media);
    } catch (error) {
      console.error(error);
      await client.sendMessage(chatId, media);
    }
  } catch (error) {
    console.error(error);
    await client.sendMessage(chatId, "Stable Diffusion generation failed.");
  }

  // Optionally, you can handle conversation history or context here

  // Optionally, update the last execution timestamp in your database
};

const command: Command = {
  name: "sd",
  description: "Text-to-image using stable diffusion",
  command: "!sd",
  commandType: "plugin",
  isDependent: false,
  help: `*SD*\n\nGenerate an image\n\n!sd [text]`,
  execute,
  public: true,
};

export default command;
