//jshint esversion:8
// code generated by chatgpt, fixed by wcyat
import { Client, Message } from "whatsapp-web.js";
import axios from "../helpers/axios.js";
import fs from "fs";
import { ObjectId } from "mongodb";
import db from "../db/index.js";

const WORDLIST_FILE_PATH = "data/wordlist.txt";

let wordlist: string[] = [];

const downloadWordlist = async () => {
  const response = await axios.get(
    "https://raw.githubusercontent.com/Tom25/Hangman/master/wordlist.txt"
  );
  const words = response.data.split("\n");
  wordlist = words.filter((word: string) => /^[a-z]{5,20}$/i.test(word));
  fs.writeFileSync(WORDLIST_FILE_PATH, wordlist.join("\n"));
};

if (fs.existsSync(WORDLIST_FILE_PATH)) {
  wordlist = fs
    .readFileSync(WORDLIST_FILE_PATH, { encoding: "utf8" })
    .split("\n");
  wordlist = wordlist.filter((word) => /^[a-z]+$/i.test(word));
} else {
  downloadWordlist();
}

interface GameState {
  word: string;
  hiddenWord: string;
  guessedLetters: string[];
  guessesLeft: number;
}

interface GameDocument {
  _id?: ObjectId;
  chatId: string;
  gameState: GameState;
}

const getRandomWord = (): string => {
  const randomIndex = Math.floor(Math.random() * wordlist.length);
  return wordlist[randomIndex];
};

const HANGMAN_STAGES: string[] = [
  `
  +---+
  |   |
      |
      |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
      |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
  |   |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
 /|   |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========`,
  `
  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========`,
];

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  if (!wordlist.length) {
    await client.sendMessage(
      chatId,
      "The wordlist is empty. Please try again later."
    );
    return;
  }
  const hangmanCollection = db("hangman").coll;
  switch (args[0]) {
    case "start": {
      if (await hangmanCollection.findOne({ chatId })) {
        return await client.sendMessage(
          chatId,
          "A game is already in progress. Type !hangman delete to delete the current game."
        );
      }
      const word = getRandomWord();
      const hiddenWord = word.replace(/\w/g, "_");
      const gameState: GameState = {
        word,
        hiddenWord,
        guessedLetters: [],
        guessesLeft: 6,
      };
      const gameDoc: GameDocument = { chatId, gameState };
      await hangmanCollection.insertOne(gameDoc);
      await client.sendMessage(
        chatId,
        `The word has ${word.length} letters. Here's the hidden word:\n\n\`\`\`${hiddenWord}\`\`\`\n\nSend \`\`\`!hangman [letter]\`\`\` to guess.`
      );
      break;
    }
    case "delete": {
      const game = (await hangmanCollection.findOne({
        chatId,
      })) as GameDocument;
      if (game) {
        await hangmanCollection.deleteOne({ chatId });
        return await client.sendMessage(
          chatId,
          `Game deleted. The word was ${game.gameState.word}.`
        );
      }
      return await client.sendMessage(chatId, "No games ongoing!");
    }
    default: {
      const gameDoc = (await hangmanCollection.findOne({
        chatId,
      })) as GameDocument;
      if (!gameDoc) {
        await client.sendMessage(
          chatId,
          `Use \`\`\`!hangman start\`\`\` to start a new game.`
        );
        return;
      }
      const gameState = gameDoc.gameState;
      const { word, guessedLetters, guessesLeft } = gameState;
      let { hiddenWord } = gameState;
      const letter = args[0].toLowerCase();
      if (new RegExp(`/^[a-z]{${gameState.word.length}}$/`).test(letter)) {
        if (letter === word) {
          await client.sendMessage(
            chatId,
            `Congratulations! You won! The word was "${word}".`
          );
          await hangmanCollection.deleteOne({ chatId });
          return;
        } else {
          return await client.sendMessage(
            chatId,
            "Word guessing is incorrect. Guessing the whole word does not count against your remaining chances."
          );
        }
      }
      if (!letter || !/^[a-z]$/.test(letter)) {
        await client.sendMessage(chatId, "Please enter a valid letter.");
        return;
      }
      if (guessedLetters.includes(letter)) {
        await client.sendMessage(
          chatId,
          `You already guessed "${letter}". Try another letter.`
        );
        return;
      }
      guessedLetters.push(letter);
      if (word.includes(letter)) {
        for (let i = 0; i < word.length; i++) {
          if (word[i] === letter) {
            const hiddenWordArr = hiddenWord.split("");
            hiddenWordArr[i] = letter;
            hiddenWord = hiddenWordArr.join("");
          }
        }
        if (hiddenWord === word) {
          await client.sendMessage(
            chatId,
            `Congratulations! You won! The word was "${word}".`
          );
          await hangmanCollection.deleteOne({ chatId });
          return;
        }
        gameState.hiddenWord = hiddenWord;
        await hangmanCollection.updateOne({ chatId }, { $set: { gameState } });
        await client.sendMessage(
          chatId,
          `Good guess! Here's the updated hidden word:\n\n\`\`\`${hiddenWord}\`\`\`\n\nSend !hangman [letter] to guess.`
        );
      } else {
        if (guessesLeft <= 1) {
          await client.sendMessage(
            chatId,
            `You lose! The word was "${word}".\n\n${HANGMAN_STAGES[6]}\n\nTry again with !hangman start.`
          );
          await hangmanCollection.deleteOne({ chatId });
          return;
        }
        gameState.guessesLeft = guessesLeft - 1;
        const remainingGuesses = gameState.guessesLeft;
        gameState.guessedLetters = guessedLetters;
        await hangmanCollection.updateOne({ chatId }, { $set: { gameState } });
        const hangmanStage = HANGMAN_STAGES[6 - remainingGuesses];
        await client.sendMessage(
          chatId,
          `Wrong guess! "${letter}" is not in the word. You have ${remainingGuesses} guesses left.\n\n${hangmanStage}\n\n\`\`\`${hiddenWord}\`\`\`\n\nSend !hangman [letter] to guess.`
        );
      }
      break;
    }
  }
};

export default {
  name: "hangman",
  command: "!hangman",
  description: "Play a game of hangman!",
  commandType: "plugin",
  isDependent: false,
  help: `*Hangman*\n\nPlay hangman. See the commands.\n\n*Commands*\n\n!hangman start\n\n*How to Play*\n\nYou will be given a hidden word with underscores representing each letter. Send !hangman [letter] to guess. If the letter is in the word, all occurrences of that letter will be revealed in the hidden word. If the letter is not in the word, you will lose one of your six guesses. If you guess all the letters before running out of guesses, you win! To start a new game, use the command "!hangman start". To make a guess, send !hangman [letter] after the initial message.`,
  execute,
  public: true,
};
