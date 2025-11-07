//jshint esversion:6

import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const morseCode: Record<string, string> = {
  a: ".-",
  b: "-...",
  c: "-.-.",
  d: "-..",
  e: ".",
  f: "..-.",
  g: "--.",
  h: "....",
  i: "..",
  j: ".---",
  k: "-.-",
  l: ".-..",
  m: "--",
  n: "-.",
  o: "---",
  p: ".--.",
  q: "--.-",
  r: ".-.",
  s: "...",
  t: "-",
  u: "..-",
  v: "...-",
  w: ".--",
  x: "-..-",
  y: "-.--",
  z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "'": ".----.",
  "!": "-.-.--",
  "/": "-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  _: "..--.-",
  '"': ".-..-.",
  $: "...-..-",
  "@": ".--.-.",
  " ": "/",
};

const reverseMorse: Record<string, string> = Object.fromEntries(
  Object.entries(morseCode).map(([k, v]) => [v, k])
);

const execute = async (client: Client, msg: Message, args: string[]) => {
  if (args.length === 0) {
    await sendLocalized(client, msg, "morse.no_argument");
    return;
  }

  const subCommand = args[0].toLowerCase();

  if (subCommand === "encode" || subCommand === "e") {
    const text = args.slice(1).join(" ").toLowerCase();

    if (!text) {
      await sendLocalized(client, msg, "morse.encode.no_text");
      return;
    }

    const morse = text
      .split("")
      .map((char) => morseCode[char] || char)
      .join(" ");

    await msg.reply(`*Morse Code:*\n\n\`\`\`${morse}\`\`\``);
    return;
  }

  if (subCommand === "decode" || subCommand === "d") {
    const morse = args.slice(1).join(" ");

    if (!morse) {
      await sendLocalized(client, msg, "morse.decode.no_text");
      return;
    }

    const text = morse
      .split(" ")
      .map((code) => reverseMorse[code] || code)
      .join("");

    await msg.reply(`*Decoded Text:*\n\n\`\`\`${text}\`\`\``);
    return;
  }

  await sendLocalized(client, msg, "morse.invalid_command");
};

const command: Command = {
  name: "Morse",
  description: "Convert text to/from morse code",
  command: "!morse",
  commandType: "plugin",
  isDependent: false,
  help: undefined,
  execute,
  public: true,
};

export default command;
