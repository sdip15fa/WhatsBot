import { exec } from "child_process";

// Function to detect if a message is about suicide
export function detectSuicide(message: string) {
  return new Promise((resolve, reject) => {
    const pythonScript = "python python/detect_suicide.py";

    // Run the Python script with the message as an argument
    exec(`${pythonScript} "${message}"`, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        const isSuicidal = Boolean(parseInt(stdout)); // Convert the string result to a boolean
        resolve(isSuicidal);
      }
    });
  });
}
