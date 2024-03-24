import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { passages } from "../helpers/dsechin.js";
import { ObjectId } from "mongodb";
import db from "../db/index.js";

interface GameState {
  passageName: string;
  paragraph: string;
  maskedParagraph: string;
  guessedCharacters: string[];
  numCharactersRemoved: number;
}

interface GameDocument {
  _id?: ObjectId;
  chatId: string;
  gameState: GameState;
}

const chineseRegExp =
  /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/;

const maskParagraph = (paragraph: string): string => {
  const chineseCharacters = paragraph.match(
    /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/g,
  );
  let length = Math.floor(Math.random() * 6) + 2;
  let charactersToRemove = Math.min(length, chineseCharacters.length);
  let start = Math.floor(
    Math.random() * (chineseCharacters.length - charactersToRemove + 1),
  );
  let cont = true;
  for (let i = 0; i < 10; i++) {
    for (let i = start; i < start + charactersToRemove; i++) {
      if (!chineseRegExp.test(paragraph[i])) {
        if (i - start > 1) {
          length = i - start;
          charactersToRemove = length;
          cont = false;
        }
        break;
      }
      if (i === start + charactersToRemove - 1) {
        cont = false;
      }
    }
    if (cont === false) {
      break;
    } else {
      start = Math.floor(
        Math.random() * (chineseCharacters.length - charactersToRemove + 1),
      );
    }
    if (i === 9) {
      return null;
    }
  }
  const end = start + charactersToRemove;

  let masked = "";
  for (let i = 0; i < paragraph.length; i++) {
    if (i >= start && i < end) {
      masked += "_";
    } else {
      masked += paragraph[i];
    }
  }

  return masked;
};

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  const gameCollection = db("chm").coll;
  const query = { chatId };

  switch (args[0]) {
    case "start": {
      if (await gameCollection.findOne(query)) {
        return await client.sendMessage(
          chatId,
          "A game is already in progress. Type !chm delete to delete the current game.",
        );
      }
      let maskedParagraph: string;
      let passageName =
        Object.keys(passages)[
          Math.floor(Math.random() * Object.keys(passages).length)
        ];
      let paragraph =
        passages[passageName][
          Math.floor(Math.random() * passages[passageName].length)
        ];
      while (!maskedParagraph) {
        passageName =
          Object.keys(passages)[
            Math.floor(Math.random() * Object.keys(passages).length)
          ];
        paragraph =
          passages[passageName][
            Math.floor(Math.random() * passages[passageName].length)
          ];

        maskedParagraph = maskParagraph(paragraph);
      }
      const numCharactersRemoved =
        paragraph.length - maskedParagraph.replace(/_/g, "").length;
      const gameState: GameState = {
        passageName,
        paragraph,
        maskedParagraph,
        guessedCharacters: [],
        numCharactersRemoved,
      };
      const gameDoc: GameDocument = { ...query, gameState };
      await gameCollection.insertOne(gameDoc);
      await client.sendMessage(
        chatId,
        `I have removed ${numCharactersRemoved} Chinese characters from a passage in "${passageName}". Here's the masked paragraph:\n\n\`\`\`${maskedParagraph}\`\`\`\n\nSend \`\`\`!chm [character]\`\`\` to guess.`,
      );
      break;
    }
    case "delete": {
      const game = (await gameCollection.findOne(query)) as GameDocument;
      if (game) {
        await gameCollection.deleteOne(query);
        return await client.sendMessage(
          chatId,
          `Game deleted. The original paragraph was: "${game.gameState.paragraph}".`,
        );
      }
      return await client.sendMessage(chatId, "No games ongoing!");
    }

    default: {
      const gameDoc = (await gameCollection.findOne(query)) as GameDocument;
      if (!gameDoc) {
        await client.sendMessage(
          chatId,
          "Use ```!chm start``` to start a new game.",
        );
        return;
      }
      const gameState = gameDoc.gameState;
      const { paragraph, maskedParagraph, guessedCharacters } = gameState;
      const guess = args[0];
      if (!guess || guess.length !== 1 || !chineseRegExp.test(guess)) {
        if (
          guess.length !== 1 &&
          guess.length === maskedParagraph.match(/_/g).length
        ) {
          if (
            maskedParagraph.replace(
              Array(guess.length).fill("_").join(""),
              guess,
            ) === paragraph
          ) {
            await client.sendMessage(
              chatId,
              `Congratulations! You won! The original paragraph was: "${paragraph}".`,
            );
            await gameCollection.deleteOne(query);
            return;
          } else {
            return await client.sendMessage(
              chatId,
              "Sorry, the guess was incorrect.",
            );
          }
        }
        await client.sendMessage(
          chatId,
          "Please enter a valid Chinese character.",
        );
        return;
      }
      if (guessedCharacters.includes(guess)) {
        await client.sendMessage(
          chatId,
          `You already guessed "${guess}". Try another character.`,
        );
        return;
      }
      guessedCharacters.push(guess);
      let newMaskedParagraph = maskedParagraph;
      const correctGuess =
        paragraph.includes(guess) &&
        paragraph
          .split("")
          .some((v, i) => v === guess && maskedParagraph[i] === "_");

      if (!correctGuess) {
        return await client.sendMessage(
          chatId,
          `Sorry, "${guess}" is not the correct character.`,
        );
      }

      for (let i = 0; i < paragraph.length; i++) {
        if (paragraph[i] === guess) {
          newMaskedParagraph =
            newMaskedParagraph.substring(0, i) +
            guess +
            newMaskedParagraph.substring(i + 1);
        }
      }
      if (newMaskedParagraph === paragraph) {
        await client.sendMessage(
          chatId,
          `Congratulations! You won! The original paragraph was: "${paragraph}".`,
        );
        await gameCollection.deleteOne(query);
        return;
      }
      gameState.maskedParagraph = newMaskedParagraph;
      gameState.guessedCharacters = guessedCharacters;
      await gameCollection.updateOne(query, { $set: { gameState } });
      await client.sendMessage(
        chatId,
        `Good guess! Here's the updated paragraph:\n\n\`\`\`${newMaskedParagraph}\`\`\`\n\n Send !chm [character] to guess.`,
      );
    }
  }
};

const command: Command = {
  name: "chm",
  command: "!chm",
  description:
    "Play a game where you guess missing characters in a Chinese paragraph!",
  commandType: "plugin",
  isDependent: false,
  help: `*Chinese Game*\n\nPlay a game where you guess missing characters in a Chinese paragraph. Start a new game with !chm start and guess characters with !chm [character].\n\n*Commands*\n\n!chm start\n!chm delete`,
  execute,
  public: true,
};

export default command;
