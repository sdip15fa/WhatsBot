//jshint esversion:8
// code generated by chatgpt, fixed by wcyat
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import axios from "../helpers/axios.js";
import fs from "fs";
import { ObjectId } from "mongodb";
import db from "../db/index.js";
import { getName } from "../helpers/getName.js";

const WORDLIST_FILE_PATH = "data/wordlist.txt";

let wordlist: string[] = [];

const downloadWordlist = async () => {
  const response = await axios.get(
    "https://raw.githubusercontent.com/Tom25/Hangman/master/wordlist.txt",
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

interface ScoreDocument {
  _id?: ObjectId;
  chatId: string;
  authorId: string;
  score: number;
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
  const authorId = msg.fromMe
    ? process.env.WTS_OWNER_ID
    : msg.author || msg.from;
  const contact = await msg.getContact();

  if (!wordlist.length) {
    await client.sendMessage(
      chatId,
      "The wordlist is empty. Please try again later.",
    );
    return;
  }
  const hangmanCollection = db("hangman").coll;
  const hangmanScoreCollection = db("hangman-score").coll;
  const chatsCollection = db("chats").coll;
  const perPerson =
    (await chatsCollection.findOne({ chatId }))?.hangman?.perPerson || false;

  const query = {
    chatId,
    ...(perPerson && { authorId }),
  };

  switch (args[0]) {
    case "start": {
      if (await hangmanCollection.findOne(query)) {
        return await client.sendMessage(
          chatId,
          `${
            perPerson ? `@${contact.id.user} ` : ""
          }A game is already in progress. Type !hangman delete to delete the current game.`,
          {
            ...(perPerson && { mentions: [contact] }),
          },
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
      const gameDoc: GameDocument = { ...query, gameState };
      await hangmanCollection.insertOne(gameDoc);
      await client.sendMessage(
        chatId,
        `${perPerson ? `@${contact.id.user} ` : ""}The word has ${
          word.length
        } letters. Here's the hidden word:\n\n\`\`\`${hiddenWord}\`\`\`\n\nSend \`\`\`!hangman [letter]\`\`\` to guess.`,
        {
          ...(perPerson && { mentions: [contact] }),
        },
      );
      break;
    }
    case "delete": {
      const game = (await hangmanCollection.findOne(query)) as GameDocument;
      if (game) {
        await hangmanCollection.deleteOne(query);
        return await client.sendMessage(
          chatId,
          `${
            perPerson ? `@${contact.id.user} ` : ""
          }Game deleted. The word was ${game.gameState.word}.`,
          {
            ...(perPerson && { mentions: [contact] }),
          },
        );
      }
      return await client.sendMessage(chatId, "No games ongoing!");
    }
    case "config": {
      if (args[1] === "per-person") {
        await chatsCollection.updateOne(
          { chatId },
          { $set: { hangman: { perPerson: !perPerson } } },
          { upsert: true },
        );
        await hangmanCollection.deleteMany({ chatId });
        return await client.sendMessage(
          chatId,
          // per-person mode is changed to the opposite
          `${perPerson ? `@${contact.id.user} ` : ""}Per-person mode ${
            !perPerson ? "enabled" : "disabled"
          }.`,
          {
            ...(perPerson && { mentions: [contact] }),
          },
        );
      } else {
        await client.sendMessage(
          chatId,
          `${perPerson ? `@${contact.id.user} ` : ""}Available configs:
- per-person: enable per-person mode, and thus the score counting`,
          {
            ...(perPerson && { mentions: [contact] }),
          },
        );
      }
      break;
    }
    case "score": {
      if (!perPerson) {
        return await client.sendMessage(
          chatId,
          "Please enable per-person mode with ```!hangman config per-person``` first to enable scores counting.",
        );
      }
      const scores = (await hangmanScoreCollection
        .find({ chatId })
        .sort({ score: -1 })
        .limit(10)
        .toArray()) as ScoreDocument[];
      if (scores.length === 0) {
        return await client.sendMessage(chatId, "No scores yet.");
      }
      const scoreMsg = `Hangman scores in ${(await msg.getChat()).name}:
${(
  await Promise.all(
    scores.map(async (v, i) => {
      return `${i + 1}. ${await getName(v.authorId)}: ${v.score} points`;
    }),
  )
).join("\n")}`;

      await client.sendMessage(chatId, scoreMsg);
      break;
    }
    default: {
      for (const arg of args.slice(0, 2)) {
        const gameDoc = (await hangmanCollection.findOne(
          query,
        )) as GameDocument;
        if (!gameDoc) {
          await client.sendMessage(
            chatId,
            `${
              perPerson ? `@${contact.id.user} ` : ""
            }Use \`\`\`!hangman start\`\`\` to start a new game.`,
            {
              ...(perPerson && { mentions: [contact] }),
            },
          );
          return;
        }
        const gameState = gameDoc.gameState;
        const { word, guessedLetters, guessesLeft } = gameState;
        let { hiddenWord } = gameState;
        const letter = arg.toLowerCase();
        if (new RegExp(`^[a-z]{${gameState.word.length}}$`).test(letter)) {
          if (hiddenWord.split("").filter((i) => i === "_").length <= 1) {
            return await client.sendMessage(
              chatId,
              `${
                perPerson ? `@${contact.id.user} ` : ""
              }You can't guess the whole word when only one character is remaining!`,
              {
                ...(perPerson && { mentions: [contact] }),
              },
            );
          }
          if (letter === word) {
            if (perPerson) {
              await hangmanScoreCollection.updateOne(
                { chatId, authorId },
                { $inc: { score: gameDoc.gameState.word.length } },
                { upsert: true },
              );
            }
            await client.sendMessage(
              chatId,
              `${
                perPerson ? `@${contact.id.user} ` : ""
              }Congratulations! You won! The word was "${word}".${
                perPerson
                  ? ` You now have ${
                      (
                        await hangmanScoreCollection.findOne({
                          chatId,
                          authorId,
                        })
                      ).score
                    } points.`
                  : ""
              }`,
              {
                ...(perPerson && { mentions: [contact] }),
              },
            );
            await hangmanCollection.deleteOne(query);
            return;
          } else {
            await client.sendMessage(
              chatId,
              `${
                perPerson ? `@${contact.id.user} ` : ""
              }Wrong guess! The word ${letter} is incorrect! Guessing the whole word does not count against your remaining chances.`,
              {
                ...(perPerson && { mentions: [contact] }),
              },
            );
            continue;
          }
        }
        if (!letter || !/^[a-z]$/.test(letter)) {
          await client.sendMessage(
            chatId,
            `${
              perPerson ? `@${contact.id.user} ` : ""
            }Please enter a valid letter.`,
            {
              mentions: [contact],
            },
          );
          continue;
        }
        if (guessedLetters.includes(letter)) {
          await client.sendMessage(
            chatId,
            `${
              perPerson ? `@${contact.id.user} ` : ""
            }You already guessed "${letter}". Try another letter.`,
            {
              ...(perPerson && { mentions: [contact] }),
            },
          );
          continue;
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
            if (perPerson) {
              await hangmanScoreCollection.updateOne(
                { chatId, authorId },
                { $inc: { score: gameDoc.gameState.word.length } },
                { upsert: true },
              );
            }
            await client.sendMessage(
              chatId,
              `${
                perPerson ? `@${contact.id.user} ` : ""
              }Congratulations! You won! The word was "${word}".${
                perPerson
                  ? ` You now have ${
                      (
                        await hangmanScoreCollection.findOne({
                          chatId,
                          authorId,
                        })
                      ).score
                    } points.`
                  : ""
              }`,
              {
                ...(perPerson && { mentions: [contact] }),
              },
            );
            await hangmanCollection.deleteOne(query);
            return;
          }
          gameState.hiddenWord = hiddenWord;
          await hangmanCollection.updateOne(query, { $set: { gameState } });
          await client.sendMessage(
            chatId,
            `${
              perPerson ? `@${contact.id.user} ` : ""
            }Good guess! ${letter} is correct! Here's the updated hidden word:\n\n\`\`\`${hiddenWord}\`\`\`\n\nSend !hangman [letter] to guess.`,
            {
              ...(perPerson && { mentions: [contact] }),
            },
          );
        } else {
          if (guessesLeft <= 1) {
            await client.sendMessage(
              chatId,
              `${
                perPerson ? `@${contact.id.user} ` : ""
              }You lose! The word was "${word}".\n\n${
                HANGMAN_STAGES[6]
              }\n\nTry again with !hangman start.`,
              {
                ...(perPerson && { mentions: [contact] }),
              },
            );
            await hangmanCollection.deleteOne(query);
            return;
          }
          gameState.guessesLeft = guessesLeft - 1;
          const remainingGuesses = gameState.guessesLeft;
          gameState.guessedLetters = guessedLetters;
          await hangmanCollection.updateOne(query, { $set: { gameState } });
          const hangmanStage = HANGMAN_STAGES[6 - remainingGuesses];
          await client.sendMessage(
            chatId,
            `${
              perPerson ? `@${contact.id.user} ` : ""
            }Wrong guess! "${letter}" is not in the word. You have ${remainingGuesses} guesses left.\n\n${hangmanStage}\n\n\`\`\`${hiddenWord}\`\`\`\n\nSend !hangman [letter] to guess.`,
            {
              ...(perPerson && { mentions: [contact] }),
            },
          );
        }
      }
      break;
    }
  }
};

const command: Command = {
  name: "hangman",
  command: "!hangman",
  description: "Play a game of hangman!",
  commandType: "plugin",
  isDependent: false,
  help: `*Hangman*\n\nPlay hangman. See the commands.\n\n*Commands*\n\n!hangman start\n!hangman config\n!hangman score\n\n*How to Play*\n\nYou will be given a hidden word with underscores representing each letter. Send !hangman [letter] to guess. If the letter is in the word, all occurrences of that letter will be revealed in the hidden word. If the letter is not in the word, you will lose one of your six guesses. If you guess all the letters before running out of guesses, you win! To start a new game, use the command "!hangman start". To make a guess, send !hangman [letter] after the initial message.`,
  execute,
  public: true,
};

export default command;
