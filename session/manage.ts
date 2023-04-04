import fs from "fs";
import AdmZip from "adm-zip";
import {
  createEncryptStream,
  setPassword,
  createDecryptStream,
} from "aes-encrypt-stream";
import crypto from "crypto";
import config from "../config.js";
import axios from "../helpers/axios.js";
import dotenv from "dotenv";
dotenv.config();

const base = `.wwebjs_auth/`;

const excludedDir = [
  "session-whatsbot/Default/Cache",
  "session-whatsbot/Default/Code Cache",
  "session-whatsbot/Default/Code Storage",
  "session-whatsbot/Default/blob_storage",
  "session-whatsbot/Default/Service Worker",
];

export function clean() {
  try {
    // delete dir if exists
    if (fs.existsSync(`.wwebjs_auth`)) {
      fs.rmSync(`.wwebjs_auth`, { recursive: true });
      console.log("Session directory cleaned");
    }
  } catch (_) {}
}
export async function write(password: string) {
  excludedDir.forEach((dir) => {
    try {
      fs.rmSync(`${base}${dir}/`, { recursive: true });
    } catch (_) {}
  });
  const zip = new AdmZip();
  zip.addLocalFolder(base);
  await zip.writeZipPromise(`temp.zip`);
  setPassword(getCipherKey(password));
  await new Promise((resolve) => {
    createEncryptStream(fs.createReadStream(`temp.zip`))
      .pipe(fs.createWriteStream(`session.secure`))
      .on("finish", resolve);
  });
  fs.unlinkSync(`temp.zip`);
}
export async function replicate() {
  try {
    setPassword(getCipherKey(config.session_key));
    await new Promise((resolve) => {
      fs.createReadStream(`session.secure`)
        .pipe(createDecryptStream(fs.createWriteStream(`temp.zip`)))
        .on("finish", resolve);
    });

    const unzip = new AdmZip(fs.readFileSync(`temp.zip`));
    unzip.extractAllToAsync(base, true);
    console.log("Session files replicated");
  } catch (error) {
    throw new Error(
      `Session file not found, corrupted or password not matched. ${error.toString()}`
    );
  } finally {
    try {
      fs.unlinkSync(`temp.zip`);
    } catch (_) {}
  }
}
export async function fetchSession() {
  try {
    if (process.env.SESSION_URL) {
      const response = await axios.get(process.env.SESSION_URL, {
        responseType: "arraybuffer",
      });
      fs.writeFileSync(`session.secure`, response.data, {
        encoding: "binary",
      });
      console.log("Session file fetched from", process.env.SESSION_URL);
    } else {
      console.log("Using local session");
    }
  } catch (error) {
    throw new Error(
      `Session fetching failed. If you are using Local machine or VPS please remove 'SESSION_URL' from Enviroment Variable. ${error.toString()}`
    );
  }
}

function getCipherKey(password: string) {
  return crypto.createHash("sha256").update(password).digest();
}
