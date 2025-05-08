import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

//jshint esversion:8
const execute = async (_client: Client, msg: Message, args: string[]) => {
  const responses = [
    "It is certain.",
    "Without a doubt.",
    "You may rely on it.",
    "Yes, definitely.",
    "It is decidedly so.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",
    "Don't count on it.",
    "Outlook not so good.",
    "My sources say no.",
    "Very doubtful.",
    "My reply is no.",
    "Better not tell you now.",
    "Ask again later.",
    "Cannot predict now.",
    "Reply hazy, try again.",
    "Concentrate and ask again.",
    "Chances aren't good.",
    "The outlook is hazy.",
    "It's not looking likely.",
    "You're better off not knowing.",
    "The answer may surprise you.",
    "Try asking a different question.",
    "It's possible, but unlikely.",
    "The signs point to no.",
    "You might be disappointed.",
    "I'm sensing a negative outcome.",
    "The future is uncertain.",
    "It's too early to tell.",
    "I'm not sure about that.",
    "I'm sensing a positive outcome.",
    "The answer is unclear.",
    "It's a mystery.",
    "You'll have to wait and see.",
    "Don't get your hopes up.",
    "It's in the realm of possibility.",
    "It's not out of the question.",
    "You're on the right track.",
    "It's highly probable.",
  ];
  const question = msg.hasQuotedMsg
    ? (await msg.getQuotedMessage()).body
    : args.join();
  if (!question) {
    return sendLocalized(_client, msg, "eight_ball.no_question");
  }
  const targetLang = await getGroupLanguage(msg);
  const responseKey = `eight_ball.response_${
    Math.floor(Math.random() * responses.length) + 1
  }`;
  const localizedResponse = getString(responseKey, targetLang);
  msg.reply(
    `${getString("eight_ball.prefix", targetLang)}\n${localizedResponse}`,
  );
};

const command: Command = {
  name: "8ball", //name of the module
  description: "eight_ball.description", // short description of what this command does
  command: "!8ball", //command with prefix. Ex command: '!test'
  commandType: "plugin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "eight_ball.help", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  public: true,
  execute,
};

export default command;
