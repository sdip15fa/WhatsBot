import axios from "../helpers/axios.js";

export default async function processImage(link: string) {
  if (!link) throw new Error("No link provided");
  try {
    const image = await axios.get(link, { responseType: "arraybuffer" });

    return {
      mimetype: "image/jpeg",
      data: Buffer.from(image.data).toString("base64"),
      filename: "whatsbotimage",
      error: null,
    };
  } catch (error) {
    return {
      mimetype: "image/jpeg",
      data: "",
      filename: "whatsbotimage",
      error: error.message,
    };
  }
}
