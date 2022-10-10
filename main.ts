//jshint esversion:8
import express from "express";
import download from "download";
const app = express();
import { Client as WTSClient, LocalAuth, MessageMedia } from "whatsapp-web.js";
import pmpermit from "./helpers/pmpermit";
import config from "./config";
import fs from "fs";
import logger from "./logger";
import { afkStatus } from "./helpers/afkWrapper";
import {
  Client as DCClient,
  GatewayIntentBits,
  EmbedBuilder,
  AttachmentBuilder,
  TextChannel,
  Message,
} from "discord.js";
import db, { client } from "./db";
import { agenda } from "./helpers/agenda";
import { getDate } from "./helpers/date";
export const dcClient = new DCClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

export const wtsClient = new WTSClient({
  puppeteer: { headless: true, args: ["--no-sandbox"] },
  authStrategy: new LocalAuth({ clientId: "whatsbot" }),
});

export default async function main() {
  await client.connect();
  await agenda.start();

  if (
    !(
      await agenda.jobs({
        name: "send count",
        data: { groupId: process.env.WTS_GROUP_ID },
      })
    ).length
  ) {
    await agenda.every(
      "1 day",
      "send count",
      { groupId: process.env.WTS_GROUP_ID },
      {
        startDate: new Date(`${getDate()}T23:59:00.000+08:00`),
      }
    );
  }

  // @ts-ignore
  wtsClient.commands = new Map();

  fs.readdir("./commands", (err, files) => {
    if (err) return console.error(err);
    files.forEach((commandFile) => {
      if (commandFile.endsWith(".js")) {
        let commandName = commandFile.replace(".js", "");
        const command = require(`./commands/${commandName}`);
        // @ts-ignore
        wtsClient.commands.set(commandName, command);
      }
    });
  });

  wtsClient.on("auth_failure", () => {
    console.error(
      "There is a problem in authentication, Kindly set the env var again and restart the app"
    );
  });

  wtsClient.on("ready", () => {
    console.log("Whatsapp logged in");
  });

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
                    attachment.attachment
                  ).catch(() => {});
                }
                return new MessageMedia(
                  attachment.contentType,
                  attachment.attachment.toString("base64"),
                  attachment.name
                );
              } catch {
                return null;
              }
            })
            .filter((a) => a)
        );

        while (media?.length > 1) {
          const i = media.shift();
          wtsClient
            .sendMessage(process.env.WTS_GROUP_ID, "", {
              ...(wtsId && { quotedMessageId: wtsId }),
              media: i,
            })
            .catch(console.log);
        }

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
      } catch (e) {
        console.log(e);
      }
  });

  wtsClient.on("message_create", async (msg) => {
    if (JSON.parse(process.env.WHATSAPP_TO_DISCORD))
      try {
        const groupId = (await msg.getChat())?.id._serialized;
        console.log("new whatsapp message");
        console.log(msg.author, groupId);
        console.log(msg.id._serialized);
        if (groupId === process.env.WTS_GROUP_ID) {
          const channel = dcClient.channels.cache.get(
            process.env.DISCORD_FORWARD_CHANNEL_ID
          );

          if (channel && channel instanceof TextChannel) {
            const contact = await msg.getContact();

            (await msg.getMentions()).forEach((contact) => {
              if (contact.name)
                msg.body = msg.body.replaceAll(
                  `@${contact.number}`,
                  `@${contact.name}`
                );
            });

            let embed = new EmbedBuilder()
              .setColor(0x0099ff)
              .setAuthor({
                name: contact.name || msg.author?.split("@")[0] || "",
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
                const contact = await quoted.getContact();
                embed = embed.setFields([
                  {
                    name: "Quoted Message",
                    value: `${contact?.name || quoted.author}: ${
                      quoted.body || quoted.type || ""
                    }`,
                  },
                ]);
              }
            }

            if (msg.hasMedia) {
              const media = await msg.downloadMedia();
              file = new AttachmentBuilder(Buffer.from(media?.data, "base64"), {
                name: media?.filename || "image.png",
              });
              const fileUrl = `attachment://${media.filename || "image.png"}`;
              embed = embed.setImage(fileUrl);
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
    if (
      groupId === process.env.WTS_GROUP_ID &&
      (msg.body || msg.hasMedia) &&
      !msg.body.startsWith("Messages")
    ) {
      const date = getDate();

      if (
        !(
          await db("count").coll.updateOne(
            { groupId, date },
            { $inc: { count: 1 } }
          )
        ).modifiedCount
      ) {
        await db("count").coll.insertOne({ groupId, date, count: 1 });
      }
    }
  });

  wtsClient.on("message", async (msg) => {
    if (JSON.parse(process.env.MARK_AS_SEEN || ""))
      await wtsClient
        .sendSeen((await msg.getChat())?.id._serialized)
        .catch(() => {});
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
          let getstatus = await afkStatus();
          if (getstatus.on) {
            await msg.reply(`${getstatus.message}\n\n_Powered by WhatsBot_`);
          }
        } catch (e) {
          await logger(
            wtsClient,
            `Incoming afk message error from ${msg.from.split("@")[0]}.\n\n${
              e?.message
            }`
          );
        }
      }
    }
  });

  wtsClient.on("message_create", async (msg) => {
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
          !msg.body.startsWith("!") &&
          !msg.body.endsWith("_Powered by WhatsBot_")
        ) {
          await pmpermit.permit(otherChat.number);
          /*await msg.reply(
            `You are automatically permitted for message !\n\n_Powered by WhatsBot_`
          );*/
        }
      }
    } catch (ignore) {}

    if (msg.body.startsWith("!")) {
      let args = msg.body.slice(1).trim().split(/ +/g);
      let command = args.shift().toLowerCase();

      if (
        msg.fromMe ||
        // @ts-ignore
        (wtsClient.commands.has(command) &&
          // @ts-ignore
          wtsClient.commands.get(command).public)
      ) {
        console.log({ command, args });

        // @ts-ignore
        if (wtsClient.commands.has(command)) {
          try {
            // @ts-ignore
            await wtsClient.commands.get(command).execute(wtsClient, msg, args);
          } catch (error) {
            console.log(error);
          }
        } else {
          await wtsClient.sendMessage(
            msg.to,
            "No such command found. Type !help to get the list of available commands"
          );
        }
      }
    }
  });

  wtsClient.on("message_revoke_everyone", async (after, before) => {
    if (before) {
      if (config.enable_delete_alert == "true") {
        const media: false | MessageMedia =
          before.hasMedia && (await before.downloadMedia().catch(() => false));
        wtsClient.sendMessage(
          before.fromMe ? before.from : before.to,
          `_${
            (await before.getContact()).name
          } deleted this message_ 👇👇\n\n ${before.body}`,
          { ...(media && { media }) }
        );
      }
    }
  });

  wtsClient.on("disconnected", (reason) => {
    console.log("Client was logged out", reason);
  });

  app.get("/", (req, res) => {
    res.send(
      '<h1>This server is powered by Whatsbot<br><a href="https://github.com/tuhinpal/WhatsBot">https://github.com/tuhinpal/WhatsBot</a></h1>'
    );
  });

  app.use(
    "/public",
    express.static("public"),
    require("serve-index")("public", { icons: true })
  ); // public directory will be publicly available

  app.listen(process.env.PORT || 8080, async () => {
    console.log(`Server listening at Port: ${process.env.PORT || 8080}`);
    await Promise.all([
      wtsClient.initialize(),
      dcClient.login(process.env.DISCORD_TOKEN).then(() => {
        console.log("Discord logged in");
      }),
    ]);
  });
}
