import fs from "fs";
import gifencoder from "gifencoder";
import probe from "probe-image-size";
import { v4 as uuidv4 } from "uuid";
import whatsapp from "whatsapp-web.js";

const tmpDir = "./tmp"; // Path to the local temporary directory

export async function toGIF(
  media: whatsapp.MessageMedia
): Promise<whatsapp.MessageMedia> {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }
  const fileExtension = media.mimetype.split("/")[1];
  const randomString = uuidv4(); // Generate a random string using UUID v4
  const inputFile = `${tmpDir}/${randomString}.${fileExtension}`;
  const outputFile = `${tmpDir}/${randomString}.gif`;

  // Decode the base64-encoded media data
  const mediaData = Buffer.from(media.data, "base64");

  // Save the media data to a file in the local temporary directory
  try {
    await fs.promises.writeFile(inputFile, mediaData);
    // Retrieve the dimensions of the media file
    const dimensions = probe.sync(fs.readFileSync(inputFile));

    // Create a GIF encoder
    const encoder = new gifencoder(dimensions.width, dimensions.height);
    const stream = fs.createWriteStream(outputFile);

    // Configure the GIF encoder
    encoder.createReadStream().pipe(stream);
    encoder.setDelay(100); // Set frame delay to 100ms

    // ... Add frames to the GIF encoder (implementation depends on the specific use case) ...
    // Start the encoding process
    encoder.start();
    encoder.finish();
    return await new Promise<whatsapp.MessageMedia>((resolve, reject) => {
      // Wait until the output file exists with a timeout of 10 seconds
      const timeout = 10000; // 10 seconds
      const startTime = Date.now();
      const checkFileExists = () => {
        fs.access(outputFile, fs.constants.F_OK, (err) => {
          if (err && Date.now() - startTime < timeout) {
            setTimeout(checkFileExists, 500);
          } else if (err) {
            reject(new Error("Timeout: Output file not found."));
          } else {
            // Read the GIF file as a base64-encoded string
            const gifData = fs.readFileSync(outputFile, "base64");
            const gifMedia = new whatsapp.MessageMedia(
              "image/gif",
              gifData,
              `${randomString}.gif`
            );
            resolve(gifMedia);
          }
        });
      };

      checkFileExists();
    });
  } finally {
    // Remove the temporary files
    fs.promises.unlink(inputFile).catch(() => {});
    fs.promises.unlink(outputFile).catch(() => {});
  }
}
