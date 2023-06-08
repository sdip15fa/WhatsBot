import { Client, Message } from "whatsapp-web.js";
import { ObjectId } from "mongodb";
import db from "../db/index.js";

const BOARD_SIZE = 3;

interface GameState {
  board: string[][];
  currentPlayer: string;
}

interface GameDocument {
  _id?: ObjectId;
  chatId: string;
  gameState: GameState;
}

const createBoard = (): string[][] => {
  const board: string[][] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    board.push([]);
    for (let j = 0; j < BOARD_SIZE; j++) {
      board[i].push(" ");
    }
  }
  return board;
};

const resetBoard = async (chatId: string) => {
  const gameCollection = db("ttt").coll;
  const gameState: GameState = {
    board: createBoard(),
    currentPlayer: "X",
  };
  await gameCollection.updateOne(
    { chatId },
    { $set: { gameState } },
    { upsert: true }
  );
};

const printBoard = async (client: Client, chatId: string) => {
  const gameCollection = db("ttt").coll;
  const gameDoc = (await gameCollection.findOne({ chatId })) as GameDocument;
  const { board } = gameDoc.gameState;

  let message = "";
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      message += board[i][j];
      if (j !== BOARD_SIZE - 1) {
        message += " | ";
      }
    }
    message += "\n";
    if (i !== BOARD_SIZE - 1) {
      message += "-".repeat(BOARD_SIZE * 4 - 1);
      message += "\n";
    }
  }
  client.sendMessage(chatId, "Current board:\n\n```\n" + message + "```\n");
};

const createEmptyBoard = (size: number): string[][] => {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => " ")
  );
};

const MAX_BOARD_SIZE = 10;

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  const [command, rowStr, colStr] = args;
  if (command !== "start" && command !== "mark" && command !== "reset") {
    client.sendMessage(
      chatId,
      "Invalid command. Use `!ttt start` to start a new game or `!ttt mark [row] [column]` to make a move."
    );
    return;
  }

  if (args[0] === "start") {
    const size = parseInt(args[1]);

    if (isNaN(size) || size < 3 || size > MAX_BOARD_SIZE) {
      client.sendMessage(
        chatId,
        `Invalid board size. Please specify a number between 3 and ${MAX_BOARD_SIZE}.`
      );
      return;
    }

    const gameCollection = db("ttt").coll;
    const gameDoc = (await gameCollection.findOne({ chatId })) as GameDocument;

    if (gameDoc) {
      client.sendMessage(
        chatId,
        "A game is already in progress. Use `!ttt reset` to reset the game."
      );
      return;
    }
    const board = createEmptyBoard(size);
    const currentPlayer = "X";
    const gameState: GameState = { board, currentPlayer };
    const newGameDoc: GameDocument = { chatId, gameState };
    await gameCollection.insertOne(newGameDoc);

    client.sendMessage(
      chatId,
      `Tic-Tac-Toe game started with a ${size}x${size} board. Player X goes first.`
    );
    await printBoard(client, chatId);
    return;
  }

  if (command === "mark") {
    if (!rowStr || !colStr) {
      client.sendMessage(
        chatId,
        "Invalid move. Please provide both row and column numbers."
      );
      return;
    }

    const row = parseInt(rowStr);
    const col = parseInt(colStr);

    if (
      isNaN(row) ||
      isNaN(col) ||
      row < 0 ||
      row >= BOARD_SIZE ||
      col < 0 ||
      col >= BOARD_SIZE
    ) {
      client.sendMessage(chatId, "Invalid row or column number.");
      return;
    }

    const gameCollection = db("ttt").coll;
    const gameDoc = (await gameCollection.findOne({ chatId })) as GameDocument;
    const { board, currentPlayer } = gameDoc.gameState;

    if (board[row][col] !== " ") {
      client.sendMessage(chatId, "That cell is already occupied.");
      return;
    }

    board[row][col] = currentPlayer;

    if (checkWin(board, currentPlayer)) {
      client.sendMessage(chatId, `Player ${currentPlayer} wins! Game over.`);
      await gameCollection.deleteOne({ chatId });
    } else if (isBoardFull(board)) {
      client.sendMessage(chatId, "It's a draw! Game over.");
      await gameCollection.deleteOne({ chatId });
    } else {
      gameDoc.gameState.board = board;
      gameDoc.gameState.currentPlayer = currentPlayer === "X" ? "O" : "X";
      await gameCollection.updateOne({ chatId }, { $set: gameDoc });
      await printBoard(client, chatId);
    }

    return;
  }

  if (command === "reset") {
    await resetBoard(chatId);
    client.sendMessage(chatId, "The game has been reset.");
    return;
  }
};

const checkWin = (board: string[][], player: string): boolean => {
  // Check rows
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (board[i].every((cell) => cell === player)) {
      return true;
    }
  }

  // Check columns
  for (let j = 0; j < BOARD_SIZE; j++) {
    if (board.every((row) => row[j] === player)) {
      return true;
    }
  }

  // Check diagonals
  if (
    board.every((row, index) => row[index] === player) ||
    board.every((row, index) => row[BOARD_SIZE - index - 1] === player)
  ) {
    return true;
  }

  return false;
};

const isBoardFull = (board: string[][]): boolean => {
  return board.every((row) => row.every((cell) => cell !== " "));
};

export default {
  name: "tictactoe",
  command: "!ttt",
  description: "Play a game of Tic-Tac-Toe!",
  commandType: "plugin",
  isDependent: false,
  help: `*Tic-Tac-Toe*\n\nPlay a game of Tic-Tac-Toe. See the commands.\n\n*Commands*\n\n!ttt start\n\n!ttt mark [row] [column]\n\n!ttt reset\n\n*How to Play*\n\nUse \`!ttt start\` to start a new game. Use \`!ttt mark [row] [column]\` to make your move by providing the row and column numbers (0-indexed). Use \`!ttt reset\` to reset the game.\n\nThe first player to get 3 marks in a row (horizontally, vertically, or diagonally) wins! If all cells are filled and no player has won, it's a draw.`,
  execute,
  public: true,
};
