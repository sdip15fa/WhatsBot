import { Command } from "../types/command.js";
import hangman from "./hangman.js";

const command: Command = {
  ...hangman,
  command: "!hm",
};

export default command;
