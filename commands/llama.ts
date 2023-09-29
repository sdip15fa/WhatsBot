// Import necessary modules and dependencies
import { LLM } from "llama-node";
import { LLamaCpp } from "llama-node/dist/llm/llama-cpp.js";
import { Client, Message } from "whatsapp-web.js";
import config from "../config.js";

const modelPath = config.llama_model_path; // Retrieve model path from environment variable
const llama = new LLM(LLamaCpp);
const llama_config = {
  modelPath, // Resolve model path based on the environment variable
  enableLogging: true,
  nCtx: 1024,
  seed: 0,
  f16Kv: false,
  logitsAll: false,
  vocabOnly: false,
  useMlock: false,
  embedding: false,
  useMmap: true,
  nGpuLayers: 0,
};

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (!modelPath) {
    return client.sendMessage(
      chatId,
      "Sorry, llama model path not specified in the environment variable."
    );
  }

  // Extract the text from the user's message
  const text = args.join(" ");

  // Call Llama model with the obtained text
  const response = await llamaChat(text);

  // Send the response back to the user
  await client.sendMessage(chatId, `Llama: ${response}`);

  // Optionally, you can handle conversation history or context here

  // Optionally, update the last execution timestamp in your database
};

// Function to interact with the Llama model
const llamaChat = async (text: string) => {
  await llama.load(llama_config);
  let response = "";
  await llama.createCompletion(
    {
      nThreads: 4,
      nTokPredict: 2048,
      topK: 40,
      topP: 0.1,
      temp: 0.2,
      repeatPenalty: 1,
      prompt: text,
    },
    (output: { token: string }) => {
      response = output.token;
    }
  );
  return response;
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
