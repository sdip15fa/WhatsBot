//jshint esversion:8
const express = require("express");
const app = express();
const { Client: WTSClient, LocalAuth } = require("whatsapp-web.js");
const pmpermit = require("./helpers/pmpermit");
const config = require("./config");
const fs = require("fs");
const logger = require("./logger");
const { afkStatus } = require("./helpers/afkWrapper");
const { Client: DCClient, GatewayIntentBits } = require("discord.js");

const dcClient = new DCClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const wtsClient = new WTSClient({
  puppeteer: { headless: true, args: ["--no-sandbox"] },
  authStrategy: new LocalAuth({ clientId: "whatsbot" }),
});

wtsClient.commands = new Map();

fs.readdir("./commands", (err, files) => {
  if (err) return console.error(e);
  files.forEach((commandFile) => {
    if (commandFile.endsWith(".js")) {
      let commandName = commandFile.replace(".js", "");
      const command = require(`./commands/${commandName}`);
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
  if (JSON.parse(process.env.DISCORD_TO_WHATSAPP)) {
    try {
      if (
        msg.channelId === process.env.DISCORD_READ_CHANNEL_ID &&
        !msg.author.bot
      ) {
        console.log("new discord message");
        console.log(msg.channelId, msg.author.tag);
        wtsClient
          .sendMessage(
            process.env.WTS_GROUP_ID,
            `msgId: ${msg.id}
author: ${msg.author.tag} (discord)

${msg.content}`
          )
          .catch(() => {});
      }
    } catch (e) {
      console.error(e);
    }
  }
});

wtsClient.on("message", async (msg) => {
  if (JSON.parse(process.env.WHATSAPP_TO_DISCORD))
    try {
      console.log("new whatsapp message");
      console.log(msg.author, msg.from);
      if (msg.author && msg.from === process.env.WTS_GROUP_ID) {
        console.log(msg.from);
        const channel = dcClient.channels.cache.get(
          process.env.DISCORD_FORWARD_CHANNEL_ID
        );
        if (channel) {
          channel
            .send(
              `msgId: ${msg.id}
author: ${msg.author.split("@")[0]} (whatsapp)

${msg.body || msg.type}`
            )
            .catch(() => {});
          if (msg.hasMedia) channel.send(await msg.downloadMedia());
        }
      }
    } catch (e) {
      console.error(e);
    }
  if (!msg.author && config.pmpermit_enabled === "true") {
    // Pm check for pmpermit module
    var checkIfAllowed = await pmpermit.handler(msg.from.split("@")[0]); // get status
    if (!checkIfAllowed.permit) {
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
      var otherChat = await (await msg.getChat()).getContact();
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
        await msg.reply(
          `You are automatically permitted for message !\n\n_Powered by WhatsBot_`
        );
      }
    }
  } catch (ignore) {}

  if (msg.fromMe && msg.body.startsWith("!")) {
    let args = msg.body.slice(1).trim().split(/ +/g);
    let command = args.shift().toLowerCase();

    console.log({ command, args });

    if (wtsClient.commands.has(command)) {
      try {
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
});

wtsClient.on("message_revoke_everyone", async (after, before) => {
  if (before) {
    if (
      before.fromMe !== true &&
      before.hasMedia !== true &&
      before.author == undefined &&
      config.enable_delete_alert == "true"
    ) {
      wtsClient.sendMessage(
        before.from,
        "_You deleted this message_ 👇👇\n\n" + before.body
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
  setInterval(() => {
    if (process.env.PING_URL) fetch(process.env.PING_URL).catch(() => {});
  }, 15 * 60 * 1000);
});
