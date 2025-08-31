import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { passages } from "../helpers/dsechin.js";
import { ObjectId } from "mongodb";
import db from "../db/index.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

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

const maskParagraph = (paragraph: string): string | null => {
  const chineseCharacters = paragraph.match(
    /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/g,
  );

  // If no Chinese characters found, return null
  if (!chineseCharacters || chineseCharacters.length === 0) {
    return null;
  }

  const length = Math.floor(Math.random() * 6) + 2;
  const charactersToRemove = Math.min(length, chineseCharacters.length);
  let start = Math.floor(
    Math.random() * (paragraph.length - charactersToRemove + 1),
  );
  let cont = true;

  for (let retryCount = 0; retryCount < 10; retryCount++) {
    // Find a valid sequence of Chinese characters
    let validSequence = true;
    for (let j = start; j < start + charactersToRemove; j++) {
      if (j >= paragraph.length || !chineseRegExp.test(paragraph[j])) {
        validSequence = false;
        break;
      }
    }

    if (validSequence) {
      cont = false;
      break;
    } else {
      // Try a different starting position
      start = Math.floor(
        Math.random() * (paragraph.length - charactersToRemove + 1),
      );
    }

    if (retryCount === 9) {
      return null;
    }
  }

  const end = start + charactersToRemove;

  let masked = "";
  for (let i = 0; i < paragraph.length; i++) {
    if (i >= start && i < end && chineseRegExp.test(paragraph[i])) {
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
        return await sendLocalized(client, msg, "chm.start.game_in_progress");
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
      let retries = 0;
      const MAX_RETRIES = 20; // Prevent infinite loop
      while (!maskedParagraph && retries < MAX_RETRIES) {
        passageName =
          Object.keys(passages)[
            Math.floor(Math.random() * Object.keys(passages).length)
          ];
        paragraph =
          passages[passageName][
            Math.floor(Math.random() * passages[passageName].length)
          ];

        maskedParagraph = maskParagraph(paragraph);
        retries++;
      }

      if (!maskedParagraph) {
        // Handle the case where masking failed after MAX_RETRIES
        return await sendLocalized(client, msg, "chm.start.mask_fail");
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
      await sendLocalized(client, msg, "chm.start.success", {
        numCharactersRemoved,
        passageName,
        maskedParagraph,
      });
      break;
    }
    case "delete": {
      const game = (await gameCollection.findOne(query)) as GameDocument;
      if (game) {
        await gameCollection.deleteOne(query);
        return await sendLocalized(client, msg, "chm.delete.success", {
          paragraph: game.gameState.paragraph,
        });
      }
      return await sendLocalized(client, msg, "chm.delete.no_game");
    }

    default: {
      const gameDoc = (await gameCollection.findOne(query)) as GameDocument;
      if (!gameDoc) {
        await sendLocalized(client, msg, "chm.guess.no_game");
        return;
      }
      const gameState = gameDoc.gameState;
      const { paragraph, maskedParagraph, guessedCharacters } = gameState;
      const guess = args[0];
      if (!guess || guess.length !== 1 || !chineseRegExp.test(guess)) {
        const underscoreMatch = maskedParagraph.match(/_/g);
        if (
          guess.length !== 1 &&
          underscoreMatch &&
          guess.length === underscoreMatch.length
        ) {
          if (
            maskedParagraph.replace(
              Array(guess.length).fill("_").join(""),
              guess,
            ) === paragraph
          ) {
            await sendLocalized(client, msg, "chm.guess.win", { paragraph });
            await gameCollection.deleteOne(query);
            return;
          } else {
            return await sendLocalized(client, msg, "chm.guess.incorrect_word");
          }
        }
        await sendLocalized(client, msg, "chm.guess.invalid_character");
        return;
      }
      if (guessedCharacters.includes(guess)) {
        await sendLocalized(client, msg, "chm.guess.already_guessed", {
          guess,
        });
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
        return await sendLocalized(
          client,
          msg,
          "chm.guess.incorrect_character",
          { guess },
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
        await sendLocalized(client, msg, "chm.guess.win", { paragraph });
        await gameCollection.deleteOne(query);
        return;
      }
      gameState.maskedParagraph = newMaskedParagraph;
      gameState.guessedCharacters = guessedCharacters;
      await gameCollection.updateOne(query, { $set: { gameState } });
      await sendLocalized(client, msg, "chm.guess.correct_character", {
        newMaskedParagraph,
      });
    }
  }
};

const command: Command = {
  name: "chm.name",
  command: "!chm",
  description: "chm.description",
  commandType: "plugin",
  isDependent: false,
  help: "chm.help",
  execute,
  public: true,
};

export default command;
