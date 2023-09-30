// Import necessary modules and dependencies
import { Client, Message } from "whatsapp-web.js";
import config from "../config.js";
import { LlamaModel, LlamaContext, LlamaChatSession } from "node-llama-cpp";

const modelPath = config.llama_model_path; // Retrieve model path from environment variable

const model = new LlamaModel({ modelPath });
const context = new LlamaContext({ model });
const session = new LlamaChatSession({ context });

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (!modelPath) {
    return client.sendMessage(
      chatId,
      "Sorry, llama model path not specified in the environment variable."
    );
  }

  // Extract the text from the user's message
  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());

  if (!args.length && !quotedMsg.body) {
    return client.sendMessage(chatId, "Please provide prompt to llama!");
  }

  const text = args.join(" ") || quotedMsg.body;

  // Call Llama model with the obtained text
  const response = await session.prompt(text);

  // Send the response back to the user
  await client.sendMessage(chatId, `Llama: ${response}`);

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
