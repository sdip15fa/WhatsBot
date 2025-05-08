import { sendLocalized } from "../helpers/localizedMessenger.js";
//jshint esversion:8
import { randomBytes } from "crypto";
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { agenda } from "../helpers/agenda.js";
import { Command } from "../types/command.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  if (!msg.hasQuotedMsg) {
    return await sendLocalized(client, msg, "schedule.no_quoted_msg");
  }
  const chats: string[] = [];
  while (/^[\d|-]+@(g|c)\.us$/.test(args[0])) {
    chats.push(args.shift());
  }
  if (chats.length && !msg.fromMe) {
    try {
      await sendLocalized(client, msg, "schedule.not_allowed");
    } catch (e) {
      console.error("Error sending 'schedule.not_allowed' message:", e);
    }
    return;
  }
  if (!chats.length) chats.push((await msg.getChat()).id._serialized);
  const date = args.join(" ");
  if (
    !(
      await Promise.all(
        chats.map(async (chatId) => {
          try {
            await client.getChatById(chatId);
            return true;
          } catch (e) {
            console.error(`Error fetching chat ${chatId}:`, e);
            sendLocalized(client, msg, "schedule.chat_not_found", {
              chatId: chatId,
            }).catch((se) => {
              console.error(
                `Error sending 'schedule.chat_not_found' for ${chatId}:`,
                se,
              );
            });
            return false;
          }
        }),
      )
    ).every((v) => v)
  )
    return;
  const quoted = await msg.getQuotedMessage();
  const id = randomBytes(10).toString("hex");
  const media: whatsapp.MessageMedia | null = await quoted
    .downloadMedia()
    .then((media) => media)
    .catch((): null => null); // Added explicit null return for catch
  await agenda
    .schedule(date, "send message", {
      id,
      chats,
      body: msg.fromMe
        ? ""
        : `${
            (await msg.getContact())?.name ||
            (msg.author || msg.from)?.split("@")[0]
          }: ` + quoted.body,
      sticker: quoted.type === "sticker",
      ...(quoted.hasMedia &&
        media && {
          media: {
            mimetype: media.mimetype,
            data: media.data,
            filename: media.filename,
          },
        }),
    })
    .then(async () => {
      await sendLocalized(client, msg, "schedule.success", {
        date: date,
        id: id,
      });
    })
    .catch(async () => {
      await sendLocalized(client, msg, "schedule.error");
    });
};

const command: Command = {
  name: "Schedule message",
  description: "schedule.description",
  command: "!schedule",
  commandType: "plugin",
  isDependent: false,
  help: "schedule.help",
  execute,
  public: true,
};

export default command;
