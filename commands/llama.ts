// Import necessary modules and dependencies
import { Client, Message } from "whatsapp-web.js";
import config from "../config.js";
import axios from "../helpers/axios.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (!config.cf_worker.url) {
    return client.sendMessage(
      chatId,
      "Sorry, cf worker url not specified in the environment variable."
    );
  }

  // Extract the text from the user's message
  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());

  if (!args.length && !quotedMsg.body) {
    return client.sendMessage(chatId, "Please provide prompt to llama!");
  }

  const text = args.join(" ") || quotedMsg.body;

  const username = config.cf_worker.username;
  const password = config.cf_worker.password;

  const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
    "base64"
  );
  const authHeader = `Basic ${encodedCredentials}`;

  // Call Llama model with the obtained text
  const response = await axios.get<{ response: string }>(config.cf_worker.url, {
    params: {
      prompt: text,
    },
    headers: {
      Authorization: authHeader,
    },
  });

  try {
    // Send the response back to the user
    await client.sendMessage(chatId, `Llama: ${response.data.response}`);
  } catch {
    await client.sendMessage(chatId, "LLaMA generation failed.");
  }

  // Optionally, you can handle conversation history or context here

  // Optionally, update the last execution timestamp in your database
};

export default {
  name: "llama",
  description: "Ask Llama",
  command: "!llama",
  commandType: "plugin",
  isDependent: false,
  help: `*Llama*\n\nAsk Llama\n\n!llama [text]`,
  execute,
  public: true,
};