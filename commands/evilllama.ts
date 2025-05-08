import { sendLocalized } from "../helpers/localizedMessenger.js";
// Import necessary modules and dependencies
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import axios from "../helpers/axios.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (!config.cf_worker.url) {
    return sendLocalized(client, msg, "evilllama.no_cf_worker_url");
  }

  // Extract the text from the user's message
  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());

  if (!args.length && !quotedMsg.body) {
    return sendLocalized(client, msg, "evilllama.no_prompt");
  }

  const text = args.join(" ") || (quotedMsg && quotedMsg.body);
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [];

  if (
    args.length &&
    msg.hasQuotedMsg &&
    quotedMsg.fromMe &&
    quotedMsg.body.startsWith("EvilLlama:")
  ) {
    let currMsg: Message | null = msg;
    while (currMsg?.body) {
      const role =
        currMsg.body.startsWith("EvilLlama:") && currMsg.fromMe
          ? "assistant"
          : "user";
      messages.unshift({
        role,
        content:
          role === "assistant"
            ? currMsg.body.replace("EvilLlama: ", "")
            : currMsg.body
                .trim()
                .slice(1)
                .trim()
                .replace("evilllama", "")
                .trim(),
      });
      if (currMsg.hasQuotedMsg) {
        const nextQuotedMsg = await currMsg.getQuotedMessage();
        if (!nextQuotedMsg?.body) {
          break;
        }

        if (
          currMsg.body.startsWith("EvilLlama:") &&
          currMsg.fromMe &&
          nextQuotedMsg.fromMe &&
          nextQuotedMsg.body.startsWith("EvilLlama:")
        ) {
          break;
        }

        if (
          !(currMsg.body.startsWith("EvilLlama:") && currMsg.fromMe) &&
          !(nextQuotedMsg.fromMe && nextQuotedMsg.body.startsWith("EvilLlama:"))
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
    // Call EvilLlama model with the obtained text
    const response = await axios.get<{ response: string }>(
      config.cf_worker.url,
      {
        params: {
          ...(!messages?.length && { prompt: text }),
          ...(messages?.length && {
            messages: encodeURIComponent(JSON.stringify(messages)),
          }),
          evil: true,
        },
        headers: {
          Authorization: authHeader,
        },
      },
    );

    // Send the response back to the user
    try {
      await sendLocalized(client, msg, "evilllama.response", {
        response: response.data.response,
      });
    } catch (sendError) {
      console.error("Failed to send EvilLlama response:", sendError);
      // Attempt to send a simpler message if the original send fails
      await client
        .sendMessage(msg.to, `EvilLlama: ${response.data.response}`)
        .catch((altSendError) => {
          console.error(
            "Failed to send alternative EvilLlama response:",
            altSendError,
          );
        });
    }
  } catch (generationError) {
    console.error("EvilLlama generation failed:", generationError);
    await sendLocalized(client, msg, "evilllama.generation_failed");
  }

  // Optionally, you can handle conversation history or context here

  // Optionally, update the last execution timestamp in your database
};

const command: Command = {
  name: "evilllama",
  description: "evilllama.description",
  command: "!evilllama",
  commandType: "plugin",
  isDependent: false,
  help: "evilllama.help",
  execute,
  public: true,
};

export default command;
