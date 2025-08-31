//jshint esversion:8
import download from "download";
import whatsapp, { Client as WTSClient } from "whatsapp-web.js";
const { MessageMedia } = whatsapp;
import pmpermit from "./helpers/pmpermit.js";
import config from "./config.js";
import logger from "./logger/index.js";
import { afkStatus } from "./helpers/afkWrapper.js";
import {
  Client as DCClient,
  GatewayIntentBits,
  EmbedBuilder,
  AttachmentBuilder,
  TextChannel,
  Message,
} from "discord.js";
import db, { client } from "./db/index.js";
import { agenda } from "./helpers/agenda.js";
import { getDate } from "./helpers/date.js";
import { Count } from "./models/count.js";
import { Media } from "./models/media.js";
import { timeToWord } from "./helpers/timeToWord.js";
import { getName } from "./helpers/getName.js";
import { suicideWordList } from "./helpers/suicide-wordlist.js";
import { commands } from "./commands/index.js";
import { writeFileSync } from "fs";

export const dcClient = new DCClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

export const wtsClient = new WTSClient({
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1920,1080",
    ],
    executablePath: "/usr/bin/chromium",
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  },
  authStrategy: new whatsapp.LocalAuth({ clientId: "whatsbot" }),
});

export default async function main() {
  await client.connect();
  await agenda.start();

  if (
    !(
      await agenda.jobs({
        name: "send count",
        "data.groupId": process.env.WTS_GROUP_ID,
      })
    )?.length
  ) {
    await agenda.every(
      "59 23 * * *",
      "send count",
      { groupId: process.env.WTS_GROUP_ID },
      {
        timezone: "Asia/Hong_Kong",
        skipImmediate: true,
      },
    );
  }

  wtsClient.on("auth_failure", () => {
    console.error(
      "There is a problem in authentication, Kindly set the env var again and restart the app",
    );
  });

  wtsClient.on("ready", () => {
    console.log("Whatsapp logged in");
  });

  if (process.env.DISCORD_TOKEN) {
    dcClient.on("messageCreate", async (msg) => {
      if (JSON.parse(process.env.DISCORD_TO_WHATSAPP))
        try {
          if (msg.author.bot) return;
          const disId = msg.reference?.messageId;

          const wtsId = (await db("messages").coll.findOne({ disId }))?.wtsId;
          console.log(msg.author.id, wtsId, process.env.WTS_GROUP_ID);

          if (
            (!JSON.parse(process.env.DISCORD_TO_WHATSAPP) ||
              msg.channelId !== process.env.DISCORD_READ_CHANNEL_ID) &&
            !wtsId
          )
            return;

          let replyMsg = msg.content;
          if (msg.author.id !== process.env.DISCORD_OWNER_ID) {
            replyMsg = `${msg.author.tag}: ${msg.content}`;
          }

          const media = await Promise.all(
            msg.attachments
              ?.map(async (attachment) => {
                try {
                  if (typeof attachment.attachment === "string") {
                    attachment.attachment = await download(
                      attachment.attachment,
                    );
                  }
                  return new MessageMedia(
                    attachment.contentType,
                    attachment.attachment.toString("base64"),
                    attachment.name,
                  );
                } catch {
                  return null;
                }
              })
              .filter((a) => a),
          );

          while (media?.length > 1) {
            const i = media.shift();
            try {
              wtsClient
                .sendMessage(process.env.WTS_GROUP_ID, "", {
                  ...(wtsId && { quotedMessageId: wtsId }),
                  media: i,
                })
                .catch(console.log);
            } catch {}
          }

          try {
            wtsClient
              .sendMessage(process.env.WTS_GROUP_ID, replyMsg, {
                ...(wtsId && { quotedMessageId: wtsId }),
                ...(media?.[0] && { media: media[0] }),
              })
              .then(() => {
                if (
                  wtsId ||
                  process.env.DISCORD_READ_CHANNEL_ID ===
                    process.env.DISCORD_FORWARD_CHANNEL_ID
                )
                  msg.delete().catch(() => {});
              })
              .catch(console.log);
          } catch {}
        } catch (e) {
          console.log(e);
        }
    });
  }

  wtsClient.on("message_create", async (msg) => {
    if (JSON.parse(process.env.WHATSAPP_TO_DISCORD))
      try {
        const groupId = (await msg.getChat())?.id._serialized;
        console.log("new whatsapp message");
        console.log("date", msg.timestamp * 1000);
        console.log("author id", msg.author);
        console.log("from", msg.from);
        console.log("group id", groupId);
        console.log("msg id", msg.id._serialized);
        if (groupId === process.env.WTS_GROUP_ID && process.env.DISCORD_TOKEN) {
          const channel = dcClient.channels.cache.get(
            process.env.DISCORD_FORWARD_CHANNEL_ID,
          );

          if (channel && channel instanceof TextChannel) {
            const contact = await msg.getContact();
            const name = await getName(contact.id._serialized);

            (await msg.getMentions()).forEach(async (contact) => {
              const name = await getName(contact.id._serialized);
              if (name)
                msg.body = msg.body?.replaceAll?.(
                  `@${contact.number}`,
                  `@${name}`,
                );
            });

            let embed = new EmbedBuilder()
              .setColor(0x47ad5d)
              .setAuthor({
                name,
                iconURL: await contact.getProfilePicUrl(),
              })
              .setDescription(msg.body || msg.type || "")
              .setTimestamp(new Date());
            let file: AttachmentBuilder | undefined = undefined;
            let disId: string | undefined = undefined;

            if (msg.hasQuotedMsg) {
              const quoted = await msg.getQuotedMessage();
              disId = (
                await db("messages").coll.findOne({
                  wtsId: quoted.id._serialized,
                })
              )?.disId;

              if (!disId) {
                const name = await getName(
                  quoted.fromMe ? process.env.WTS_OWNER_ID : quoted.author,
                );
                embed = embed.setFields([
                  {
                    name: "Quoted Message",
                    value: `${name || quoted.author}: ${
                      quoted.body || quoted.type || ""
                    }`,
                  },
                ]);
              }
            }

            if (msg.hasMedia) {
              try {
                const media = await msg.downloadMedia();
                file = new AttachmentBuilder(
                  Buffer.from(media?.data, "base64"),
                  {
                    name: media?.filename || "image.png",
                  },
                );
                const fileUrl = `attachment://${media.filename || "image.png"}`;
                embed = embed.setImage(fileUrl);
              } catch {}
            }

            const newMsg = { embeds: [embed], ...(file && { files: [file] }) };
            const onSuccess = async (message: Message<true>) => {
              await db("messages").coll.insertOne({
                wtsId: msg.id._serialized,
                disId: message.id,
              });
            };

            if (disId) {
              channel.messages.fetch(disId).then((message) => {
                message
                  .reply(newMsg)
                  .then(onSuccess)
                  .catch(() => {});
              });
            } else {
              channel
                .send(newMsg)
                .then(onSuccess)
                .catch(() => {});
            }
          }
        }
      } catch (e) {
        console.log(e);
      }
  });

  wtsClient.on("message_create", async (msg) => {
    const groupId = (await msg.getChat()).id._serialized;
    const words = msg.body?.split(" ").length || 0;
    if (groupId && !msg.isStatus) {
      const date = getDate();

      if (
        !(
          await db("count").coll.updateOne(
            { groupId, date },
            { $inc: { count: 1, words } },
          )
        ).modifiedCount
      ) {
        await db("count").coll.insertOne(<Count>{
          groupId,
          date,
          count: 1,
          words,
        });
      }

      if (
        !(
          await db("count").coll.updateOne(
            {
              groupId,
              date,
              users: {
                $elemMatch: {
                  id: msg.fromMe
                    ? process.env.WTS_OWNER_ID
                    : msg.author || msg.from,
                },
              },
            },
            {
              $inc: { "users.$.count": 1, "users.$.words": words },
            },
          )
        ).modifiedCount
      ) {
        const name = await getName(
          msg.fromMe ? process.env.WTS_OWNER_ID : msg.author || msg.from,
        );
        await db("count").coll.updateOne(
          { groupId, date },
          {
            $push: {
              users: {
                id: msg.fromMe
                  ? process.env.WTS_OWNER_ID
                  : msg.author || msg.from,
                name,
                count: 1,
                words,
              },
            },
          },
        );
      }
    }
  });

  wtsClient.on("message", async (msg) => {
    const chatId = (await msg.getChat()).id._serialized;
    if ((await db("chats").coll.findOne({ chatId }))?.autoreply) {
      if (!msg.body.trim().startsWith("$"))
        await wtsClient.sendMessage(chatId, msg.body);
    }
  });

  wtsClient.on("message_revoke_everyone", async (_msg, before) => {
    const groupId = (await before.getChat())?.id?._serialized;
    if (groupId && !before.isStatus) {
      const date = getDate(before.timestamp * 1000);

      await db("count").coll.updateOne(
        { groupId, date },
        { $inc: { count: -1 } },
      );

      await db("count").coll.updateOne(
        {
          groupId,
          date,
          users: {
            $elemMatch: {
              id: before.fromMe
                ? process.env.WTS_OWNER_ID
                : before.author || before.from,
            },
          },
        },
        {
          $inc: { "users.$.count": -1 },
        },
      );
    }
  });

  wtsClient.on("message", async (msg) => {
    if (JSON.parse(process.env.MARK_AS_SEEN || ""))
      await wtsClient
        .sendSeen((await msg.getChat())?.id._serialized)
        .catch(() => {});
  });

  wtsClient.on("message", async (msg) => {
    const chatId = (await msg.getChat()).id._serialized;
    const chatDoc = await db("chats").coll.findOne({ chatId });

    if (chatDoc?.blacklist?.length) {
      const converted = msg.body?.replaceAll(" ", "")?.toLowerCase();
      if (
        chatDoc?.blacklist.some(
          (v: string) => converted?.includes?.(v?.replaceAll(" ", "")),
        )
      ) {
        try {
          await msg.delete(true);
        } catch {}
      }
    }

    if (chatDoc?.blacklist_media?.length && msg.hasMedia && msg.mediaKey) {
      if (chatDoc?.blacklist_media?.includes(msg.mediaKey)) {
        try {
          await msg.delete(true);
        } catch {}
      }
    }
  });

  wtsClient.on("message_create", async (msg) => {
    if (config.enable_delete_alert == "true") {
      if (msg.isStatus) {
        try {
          const media =
            msg.hasMedia &&
            (await msg.downloadMedia().catch(() => null as any));
          await wtsClient
            .sendMessage(
              process.env.WTS_OWNER_ID,
              `Status from ${
                (await msg.getContact())?.name ||
                (msg.author || msg.from)?.split("@")[0]
              } with id \`\`\`${msg.id._serialized}\`\`\`:
${msg.body || msg.type}`,
              { ...(media && { media }) },
            )
            .then((newMsg) => {
              db("media").coll.insertOne(<Media>{
                orgId: msg.id._serialized,
                fwdId: newMsg.id._serialized,
              });
            })
            .catch(() => {});
        } catch {}
      } else if (msg.hasMedia) {
        const chat = await msg.getChat();
        const chatId = chat.id._serialized;
        if (
          await db("chats").coll.findOne({
            chatId,
            norecord: true,
          })
        )
          return;
        const media = await msg.downloadMedia().catch(() => null as any);
        if (!media) return;
        const sendTo =
          process.env.WTS_MEDIA_FORWARD_GROUP_ID || process.env.WTS_OWNER_ID;
        if (chatId === sendTo) return;
        try {
          await wtsClient
            .sendMessage(
              sendTo,
              `Message from ${
                (await msg.getContact())?.name ||
                (msg.author || msg.from)?.split("@")[0]
              } with id \`\`\`${msg.id._serialized}\`\`\` in ${
                chat?.name || chat?.id
              }:
${msg.body || msg.type}`,
              { ...(msg.type !== "sticker" && { media }) },
            )
            .then((newMsg) => {
              db("media").coll.insertOne(<Media>{
                orgId: msg.id._serialized,
                fwdId: newMsg.id._serialized,
              });
            })
            .catch(() => {});
        } catch {}
        if (msg.type === "sticker") {
          try {
            await wtsClient.sendMessage(
              sendTo,
              new MessageMedia(media.mimetype, media.data, media.filename),
              { sendMediaAsSticker: true },
            );
          } catch {}
        }
      }
    }
  });

  wtsClient.on("message", async (msg) => {
    if (!msg.author && config.pmpermit_enabled === "true") {
      // Pm check for pmpermit module
      const checkIfAllowed = await pmpermit.handler(msg.from.split("@")[0]); // get status
      if (!(checkIfAllowed.permit || (await msg.getContact())?.name)) {
        // if not permitted
        if (checkIfAllowed.block) {
          await msg.reply(checkIfAllowed.msg);
          setTimeout(async () => {
            await (await msg.getContact()).block();
          }, 3000);
        } else if (!checkIfAllowed.block) {
          msg.reply(checkIfAllowed.msg);
        }
      } else {
        await checkAndApplyAfkMode();
      }
    }

    if (!msg.author && config.pmpermit_enabled !== "true") {
      await checkAndApplyAfkMode();
    }

    async function checkAndApplyAfkMode() {
      if (!msg.author) {
        try {
          const getstatus = await afkStatus();
          if (getstatus.on) {
            await msg.reply(`${getstatus.message}\n\n_Powered by WhatsBot_`);
          }
        } catch (e) {
          await logger(
            wtsClient,
            `Incoming afk message error from ${
              msg.from.split("@")[0]
            }.\n\n${e?.message}`,
          );
        }
      }
    }
  });

  // suicide
  wtsClient.on("message", async (msg) => {
    const chatId = (await msg.getChat())?.id._serialized;
    if (
      chatId &&
      (await db("chats").coll.findOne({
        chatId,
        suicide: true,
        disabled: { $not: { $eq: true } },
      })) &&
      (await msg.getContact())?.name &&
      msg.body
    ) {
      const triggers = suicideWordList.map((x) => x.replace(/\|/g, " *"));

      if (
        triggers.some((trigger) =>
          new RegExp(trigger, "g").test(msg.body.toLowerCase()),
        )
      ) {
        await msg.reply(`Please, do not suicide!

Your life is important. We all care very deeply about you. I understand you don't feel like you matter right now, but I can tell you with 100% confidence that you do. I know you might be reluctant, but please just give the suicide prevention hotline just one more chance.

Hong Kong
Call 2896 0000 (The Samaritans)

United Kingdom
Call 116-123 or Text SHOUT to 85258

Other countries
https://faq.whatsapp.com/1417269125743673

*_This is an automated message as I have detected a keyword related to suicide_*`);
      }
    }
  });

  wtsClient.on("message_create", async (msg) => {
    const chatId = (await msg.getChat())?.id._serialized;
    // auto pmpermit
    try {
      if (config.pmpermit_enabled == "true") {
        const otherChat = await (await msg.getChat()).getContact();
        if (
          msg.fromMe &&
          msg.type !== "notification_template" &&
          otherChat.isUser &&
          !(await pmpermit.isPermitted(otherChat.number)) &&
          !otherChat.isMe &&
          !msg.body?.startsWith?.("!") &&
          !msg.body?.endsWith?.("_Powered by WhatsBot_")
        ) {
          await pmpermit.permit(otherChat.number);
          /*await msg.reply(
            `You are automatically permitted for message !\n\n_Powered by WhatsBot_`
          );*/
        }
      }
    } catch (ignore) {}

    if (
      msg.body?.startsWith?.("!") &&
      ((await msg.getContact())?.name || msg.fromMe)
    ) {
      const args = msg.body?.slice?.(1)?.trim?.()?.split?.(/ +/g);
      const command = args.shift().toLowerCase();

      if (
        (await db("chats").coll.findOne({ chatId, disabled: true })) &&
        command !== "enable"
      ) {
        return;
      }

      if (
        msg.fromMe ||
        (commands.has(command) && commands.get(command).public)
      ) {
        console.log({ command, args });

        if (commands.has(command)) {
          try {
            await commands.get(command).execute(wtsClient, msg, args);
          } catch (error) {
            console.log(error);
          }
        } else if (msg.fromMe) {
          await wtsClient.sendMessage(
            process.env.WTS_OWNER_ID,
            "No such command found. Type !help to get the list of available commands",
          );
        }
      }
    }
  });

  wtsClient.on("message_edit", async (after, before) => {
    try {
      if (before) {
        const chat = await after.getChat();
        const chatId = chat.id._serialized;
        if (
          config.enable_delete_alert === "true" &&
          !(await db("chats").coll.findOne({
            chatId,
            norecord: true,
          }))
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (chatId === process.env.WTS_OWNER_ID) return;
          wtsClient
            .sendMessage(
              process.env.WTS_OWNER_ID,
              `_${after.isStatus ? "Status" : "Message"} from ${
                (await after.getContact())?.name ||
                (after.author || after.from)?.split("@")[0]
              } with id \`\`\`${after.id._serialized}\`\`\` sent *${timeToWord(
                after.timestamp * 1000,
              )} from now* was deleted in ${
                chat.name || chat.id
              }_ 👇👇\n\n${before}`,
            )
            .catch(console.log);
        }
      }
    } catch (e) {
      console.log(e);
    }
  });

  wtsClient.on("message_revoke_everyone", async (_after, before) => {
    try {
      if (before) {
        const chat = await before.getChat();
        const chatId = chat.id._serialized;
        if (
          config.enable_delete_alert == "true" &&
          !(await db("chats").coll.findOne({
            chatId,
            norecord: true,
          }))
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const media: any =
            before.hasMedia &&
            (await before
              .downloadMedia()
              .then((media) => media)
              .catch(() => false));
          if (chatId === process.env.WTS_OWNER_ID) return;
          try {
            wtsClient
              .sendMessage(
                process.env.WTS_OWNER_ID,
                `_${before.isStatus ? "Status" : "Message"} from ${
                  (await before.getContact())?.name ||
                  (before.author || before.from)?.split("@")[0]
                } with id \`\`\`${
                  before.id._serialized
                }\`\`\` sent *${timeToWord(
                  before.timestamp * 1000,
                )} from now* was deleted in ${chat.name || chat.id}_ 👇👇\n\n${
                  before.body || before.type
                }`,
                { ...(media && { media }) },
              )
              .catch(console.log);
          } catch {}
        }
      }
    } catch (e) {
      console.log(e);
    }
  });

  wtsClient.on("disconnected", (reason) => {
    console.log("Client was logged out", reason);
  });

  (async () => {
    console.log("starting...");
    wtsClient.initialize();
    setInterval(() => {
      wtsClient.pupPage
        ?.screenshot({
          fullPage: true,
          type: "png",
        })
        .then((screenshot) => {
          writeFileSync("screenshot.png", screenshot as string, "base64");
        });
    }, 30000);
    if (process.env.DISCORD_TOKEN) {
      dcClient.login(process.env.DISCORD_TOKEN).then(() => {
        console.log("Discord logged in");
      });
    }
    //    console.log(await wtsClient.getWWebVersion());
  })();
}
