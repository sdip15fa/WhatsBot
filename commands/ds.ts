// Import necessary modules and dependencies
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
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
    return client.sendMessage(chatId, "Please provide prompt to deepseek!");
  }

  const text = args.join(" ") || quotedMsg.body;
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [];

  if (
    args.length &&
    msg.hasQuotedMsg &&
    quotedMsg.fromMe &&
    quotedMsg.body.startsWith("Deepseek:")
  ) {
    let currMsg: Message | null = msg;
    while (currMsg?.body) {
      const role =
        currMsg.body.startsWith("Deepseek:") && currMsg.fromMe
          ? "assistant"
          : "user";
      messages.unshift({
        role,
        content:
          role === "assistant"
            ? currMsg.body.replace("Deepseek: ", "")
            : currMsg.body.trim().slice(1).trim().replace("ds", "").trim(),
      });
      if (currMsg.hasQuotedMsg) {
        const nextQuotedMsg = await currMsg.getQuotedMessage();
        if (!nextQuotedMsg?.body) {
          break;
        }

        if (
          currMsg.body.startsWith("Deepseek:") &&
          currMsg.fromMe &&
          nextQuotedMsg.fromMe &&
          nextQuotedMsg.body.startsWith("Deepseek:")
        ) {
          break;
        }

        if (
          !(currMsg.body.startsWith("Deepseek:") && currMsg.fromMe) &&
          !(nextQuotedMsg.fromMe && nextQuotedMsg.body.startsWith("Deepseek:"))
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

  try {
    // Call deepseek model with the obtained text
    const response = await axios.get<{ response: string }>(
      config.cf_worker.url,
      {
        params: {
          ...(!messages?.length && { prompt: text }),
          ...(messages?.length && {
            messages: encodeURIComponent(JSON.stringify(messages)),
          }),
        },
        headers: {
          Authorization: authHeader,
        },
      },
    );

    // Send the response back to the user
    try {
      await msg.reply(`Deepseek: ${response.data.response}`);
    } catch (error) {
      console.error(error);
      await client.sendMessage(chatId, `Deepseek: ${response.data.response}`);
    }
  } catch {
    await client.sendMessage(chatId, "Deepseek generation failed.");
  }

  // Optionally, you can handle conversation history or context here

  // Optionally, update the last execution timestamp in your database
};

const command: Command = {
  name: "deepseek",
  description: "Ask Deepseek",
  command: "!ds",
  commandType: "plugin",
  isDependent: false,
  help: `*Deepseek*\n\nAsk Deepseek\n\n!ds [text]`,
  execute,
  public: true,
};

export default command;
