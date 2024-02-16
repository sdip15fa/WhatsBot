// Import necessary modules and dependencies
import { Client, Message } from "whatsapp-web.js";
import config from "../config.js";
import axios from "../helpers/axios.js";

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
    return client.sendMessage(chatId, "Please provide prompt to llama!");
  }

  const text = args.join(" ") || quotedMsg.body;
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [
      {
        role: "system",
        content:
          "Below are a series of dialogues between various people and an AI assistant. The AI tries to be helpful, polite, honest, sophisticated, emotionally aware, and humble-but-knowledgeable. The assistant is happy to help with almost anything, and will do its best to understand exactly what is needed. It also tries to avoid giving false or misleading information, and it caveats when it isn't entirely sure about the right answer. That said, the assistant is practical and really does its best, and doesn't let caution get too much in the way of being useful.",
      },
    ];

  if (
    args.length &&
    msg.hasQuotedMsg &&
    quotedMsg.fromMe &&
    quotedMsg.body.startsWith("Llama:")
  ) {
    let currMsg: Message | null = msg;
    while (currMsg?.body) {
      const role =
        currMsg.body.startsWith("Llama:") && currMsg.fromMe
          ? "assistant"
          : "user";
      messages.unshift({
        role,
        content:
          role === "assistant"
            ? currMsg.body.replace("Llama: ", "")
            : currMsg.body,
      });
      if (currMsg.hasQuotedMsg) {
        const nextQuotedMsg = await currMsg.getQuotedMessage();
        if (!nextQuotedMsg?.body) {
          break;
        }

        if (
          currMsg.body.startsWith("Llama:") &&
          currMsg.fromMe &&
          nextQuotedMsg.fromMe &&
          nextQuotedMsg.body.startsWith("Llama:")
        ) {
          break;
        }

        if (
          !(currMsg.body.startsWith("Llama:") && currMsg.fromMe) &&
          !(nextQuotedMsg.fromMe && nextQuotedMsg.body.startsWith("Llama:"))
        ) {
          break;
        }

        currMsg = nextQuotedMsg;
      } else {
        break;
      }
    }
  }

  const username = config.cf_worker.username;
  const password = config.cf_worker.password;

  const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
    "base64",
  );
  const authHeader = `Basic ${encodedCredentials}`;

  // Call Llama model with the obtained text
  const response = await axios.get<{ response: string }>(config.cf_worker.url, {
    params: {
      ...(!(messages?.length > 1) && { prompt: text }),
      ...(messages?.length > 1 && {
        messages: encodeURIComponent(JSON.stringify(messages)),
      }),
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
