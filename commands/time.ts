//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

function isValidTimeZone(tz: string) {
  if (!tz) {
    return false;
  }

  if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
    throw new Error("Time zones are not available in this environment");
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (ex) {
    return false;
  }
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  const timeZone = isValidTimeZone(args[0]) ? args[0] : process.env.TZ;
  try {
    const date = new Date(
      (isValidTimeZone(args[0]) ? args[1] : args[0]) || new Date(),
    );
    await sendLocalized(client, msg, "time.success", {
      timeZone,
      localTime: date.toLocaleString("en-UK", { timeZone }),
      isoTime: date.toISOString(),
    });
  } catch {
    return await sendLocalized(client, msg, "time.error");
  }
};

const command: Command = {
  name: "Time",
  description: "Query time in specific time zone",
  command: "!time",
  commandType: "plugin",
  isDependent: false,
  help: "time.help",
  execute,
  public: true,
};

export default command;
