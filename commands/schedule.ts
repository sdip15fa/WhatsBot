//jshint esversion:8
import { randomBytes } from "crypto";
import { Client, Message, MessageMedia } from "whatsapp-web.js";
import { agenda } from "../helpers/agenda.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  if (!msg.hasQuotedMsg) {
    return await msg.reply("Please quote a message to schedule!");
  }
  const chats: string[] = [];
  while (/^[\d|-]+@(g|c)\.us$/.test(args[0])) {
    chats.push(args.shift());
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
          } catch {
            msg.reply(`Chat ${chatId} not found`).catch(() => {});
            return false;
          }
        })
      )
    ).every((v) => v)
  )
    return;
  const quoted = await msg.getQuotedMessage();
  const id = randomBytes(10).toString("hex");
  const media: MessageMedia | null = await quoted
    .downloadMedia()
    .then((media) => media)
    .catch(() => null);
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
      await msg.reply(`Scheduled for *_${date}_* with id \`\`\`${id}\`\`\`.`);
    })
    .catch(async () => {
      await msg.reply("An error occurred.");
    });
};

export default {
  name: "Schedule message",
  description: "Schedule a message to be sent at a specific time",
  command: "!schedule",
  commandType: "plugin",
  isDependent: false,
  help: `*Schedule a message to be sent at a specific time.*\n\nReply to the message you want to schedule.\n\n*!schedule [chat id] [time]*\n\nIf the chat id is invalid / omitted the current chat would be used.\n\nTime example: \`\`\`in 1 minute\`\`\`\n\nFor list of chats and chat ids, use !chatlist.`,
  execute,
  public: true,
};
