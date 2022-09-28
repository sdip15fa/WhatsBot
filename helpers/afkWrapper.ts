import fs from "fs";
import path from "path";

export function startAfk(message: string) {
  fs.writeFileSync(
    path.join(__dirname, `../cache/afk.json`),
    JSON.stringify({
      on: true,
      message: message || "Currently I'm away. I will be back soon!",
    })
  );
}

export function afkStatus() {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, `../cache/afk.json`), "utf-8")
    );
  } catch (error) {
    return {
      on: false,
      message: null,
    };
  }
}

export function stopAfk() {
  fs.writeFileSync(
    path.join(__dirname, `../cache/afk.json`),
    JSON.stringify({
      on: false,
      message: null,
    })
  );
}
