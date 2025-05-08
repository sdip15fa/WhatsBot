import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

//jshint esversion:8
const execute = async (_client: Client, msg: Message) => {
  const jokes = [
    "Why don't scientists trust atoms? Because they make up everything.",
    "Why don't eggs tell jokes? They'd crack each other up.",
    "Why did the tomato turn red? Because it saw the salad dressing!",
    "What do you call a fake noodle? An impasta.",
    "Why did the scarecrow win an award? Because he was outstanding in his field.",
    "Why don't lobsters share? Because they're shellfish.",
    "What do you call a can opener that doesn't work? A can't opener.",
    "I told my wife she was drawing her eyebrows too high. She looked surprised.",
    "Why don't some couples go to the gym? Because some relationships don't work out.",
    "Why did the bicycle fall over? Because it was two-tired.",
    "What do you call a bear with no socks on? Barefoot.",
    "Why did the banana go to the doctor? He wasn't peeling well.",
    "Why did the chicken cross the playground? To get to the other slide.",
    "What do you call a group of cows playing instruments? A moo-sical band.",
    "Why did the baker go to the bank? He needed dough.",
    "Why did the mushroom go to the party? Because he was a fun-gi.",
    "Why did the pencil break up with the eraser? It was a sharp move.",
    "Why did the computer go to the doctor? It had a virus!",
    "Why did the kid bring a ladder to school? He wanted to reach his full potential!",
    "What do you call a dog that does magic tricks? A labracadabrador!",
    "Why did the rabbit go to the doctor? He had hare-loss!",
    "Why did the orange stop in the middle of the road? It ran out of juice!",
    "What do you call a group of cats playing instruments? A mew-sical band!",
    "Why did the turkey join the band? He was a drumstick!",
    "Why did the banana go to the hair salon? He wasn't peeling well!",
    "Why did the astronaut break up with his girlfriend? He needed space!",
    "What do you call a can opener that doesn't work? A can't opener!",
    "Why did the chicken go to the gym? To get some egg-cellent abs!",
    "Why did the mushroom get invited to all the parties? Because he's a fun-gi!",
    "Why did the pencil break up with the eraser? It was a sharp move!",
    "What do you call a bear with no socks on? Barefoot!",
    "Why did the computer screen go to therapy? It was feeling a little glitchy!",
    "Why did the kid bring a magnet to school? He wanted to attract attention!",
    "What do you call a cow that plays hide-and-seek? A moo-ving target!",
    "Why did the scarecrow win an award? Because he was outstanding in his field!",
    "Why did the bicycle fall over? Because it was two-tired!",
    "What do you call a fish with a sunburn? A star-fish!",
    "Why did the rabbit get kicked out of the bar? He was making too many hare-brained jokes!",
    "Why did the kid bring a ladder to the party? He wanted to take things to the next level!",
    "What do you call a dog that does gymnastics? A paws-itive athlete!",
    "Why did the chicken go to the beauty parlor? He wanted a fowl haircut!",
    "Why did the banana go to the doctor? He wasn't peeling well!",
    "What do you call a group of ducks playing instruments? A quack-cel band!",
    "What do you call a cat that's a good listener? A purr-fect listener!",
    "Why did the kid bring a compass to school? He wanted to navigate his way to success!",
    "Why did the rabbit get kicked out of the movie theater? He was caught hare-handed!",
    "What do you call a dog that's a good dancer? A paw-some dancer!",
  ];
  const targetLang = await getGroupLanguage(msg);
  const jokeKey = `joke.response_${
    Math.floor(Math.random() * jokes.length) + 1
  }`;
  const localizedJoke = getString(jokeKey, targetLang);
  try {
    msg.reply(localizedJoke);
  } catch (e) {
    console.error("Failed to send joke:", e);
    // await sendLocalized(_client, msg, "joke.send_error");
  }
};
const command: Command = {
  name: "joke", //name of the module
  description: "joke.description", // short description of what this command does
  command: "!joke", //command with prefix. Ex command: '!test'
  commandType: "plugin", //
  isDependent: false, //whether this command is related/dependent to some other command
  help: "joke.help", // a string descring how to use this command Ex = help : 'To use this command type!test arguments'
  public: true,
  execute,
};
export default command;
