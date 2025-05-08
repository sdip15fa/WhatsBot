import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
//jshint esversion:8
import config from "../config.js";
import axios from "../helpers/axios.js";
import whatsapp, {
  BatteryInfo,
  Client,
  ClientInfoPhone,
  Message,
} from "whatsapp-web.js";
import { Command } from "../types/command.js";

async function get(
  battery: BatteryInfo,
  phn_info: ClientInfoPhone,
  msg: Message,
) {
  let batttxt;

  if (battery.plugged) {
    batttxt = `${battery.battery}% (${getString(
      "start.charging",
      await getGroupLanguage(msg),
    )})`;
  } else {
    batttxt = `${battery.battery}%`;
  }

  return {
    msg:
      `*${getString(
        "start.whatsbot",
        await getGroupLanguage(msg),
      )}*\n\n${getString(
        "start.powered_by",
        await getGroupLanguage(msg),
      )}\n\n*${getString(
        "start.battery",
        await getGroupLanguage(msg),
      )}*: ${batttxt}\n*${getString(
        "start.device",
        await getGroupLanguage(msg),
      )}*: ${phn_info.device_manufacturer} ${
        phn_info.device_model
      }\n*${getString("start.wa_version", await getGroupLanguage(msg))}*: ${
        phn_info.wa_version
      }\n*${getString("start.pmpermit", await getGroupLanguage(msg))}*: ${
        config.pmpermit_enabled
      }\n\n*${getString("start.repo_url", await getGroupLanguage(msg))} 👇*\n` +
      "```https://github.com/tuhinpal/WhatsBot```",
    mimetype: "image/jpeg",
    data: Buffer.from(
      (
        await axios.get("https://telegra.ph/file/ecbc27f276890bf2f65a2.jpg", {
          responseType: "arraybuffer",
        })
      ).data,
    ).toString("base64"),
    filename: "start.jpg",
  };
}

const execute = async (client: Client, msg: Message) => {
  const startdata = await get(
    await client.info.getBatteryStatus(),
    client.info.phone,
    msg,
  );
  try {
    await client.sendMessage(
      msg.to,
      new whatsapp.MessageMedia(
        startdata.mimetype,
        startdata.data,
        startdata.filename,
      ),
      { caption: startdata.msg },
    );
  } catch (e) {
    console.error("Failed to send start message:", e);
    // await sendLocalized(client, msg, "start.send_error");
  }
};

const command: Command = {
  name: "Start",
  description: "start.description",
  command: "!start",
  commandType: "info",
  isDependent: false,
  help: "start.help",
  execute,
  public: false,
};

export default command;
