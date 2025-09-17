import { sendLocalized } from "../helpers/localizedMessenger.js";
// Import necessary modules and dependencies
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import axios from "../helpers/axios.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (!config.cf_worker.url) {
    return sendLocalized(client, msg, "gpt.no_cf_worker_url");
  }

  // Extract the text from the user's message
  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());

  if (!args.length && !quotedMsg?.body) {
    return sendLocalized(client, msg, "gpt.no_prompt");
  }

  let contextText = "";
  if (quotedMsg?.body) {
    contextText = `Context from quoted message: ${quotedMsg.body}\n\n`;
  }

  const userPrompt = args.join(" ");
  const text = contextText + userPrompt;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [];

  if (
    args.length &&
    msg.hasQuotedMsg &&
    quotedMsg.fromMe &&
    quotedMsg.body.startsWith("GPT:")
  ) {
    let currMsg: Message | null = msg;
    while (currMsg?.body) {
      const role =
        currMsg.body.startsWith("GPT:") && currMsg.fromMe
          ? "assistant"
          : "user";
      messages.unshift({
        role,
        content:
          role === "assistant"
            ? currMsg.body.replace("GPT: ", "")
            : currMsg.body.trim().slice(1).trim().replace("gpt", "").trim(),
      });
      if (currMsg.hasQuotedMsg) {
        const nextQuotedMsg = await currMsg.getQuotedMessage();
        if (!nextQuotedMsg?.body) {
          break;
        }

        if (
          currMsg.body.startsWith("GPT:") &&
          currMsg.fromMe &&
          nextQuotedMsg.fromMe &&
          nextQuotedMsg.body.startsWith("GPT:")
        ) {
          break;
        }

        if (
          !(currMsg.body.startsWith("GPT:") && currMsg.fromMe) &&
          !(nextQuotedMsg.fromMe && nextQuotedMsg.body.startsWith("GPT:"))
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
    // Call GPT model with the obtained text
    const response = await axios.get<{ response: string }>(
      `${config.cf_worker.url}gpt`,
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
      await sendLocalized(client, msg, "gpt.response", {
        response: response.data.response,
      });
    } catch (sendError) {
      console.error("Failed to send GPT response:", sendError);
      await client
        .sendMessage(msg.to, `GPT: ${response.data.response}`)
        .catch((altSendError) => {
          console.error(
            "Failed to send alternative GPT response:",
            altSendError,
          );
        });
    }
  } catch (generationError) {
    console.error("GPT generation failed:", generationError);
    await sendLocalized(client, msg, "gpt.generation_failed");
  }

  // Optionally, you can handle conversation history or context here

  // Optionally, update the last execution timestamp in your database
};

const command: Command = {
  name: "gpt",
  description: "gpt.description",
  command: "!gpt",
  commandType: "plugin",
  isDependent: false,
  help: "gpt.help",
  execute,
  public: true,
};

export default command;
