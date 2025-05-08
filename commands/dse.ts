import humanizeDuration from "humanize-duration";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

const timetable: { [key: string]: string } = {
  "VA 1": "2024-04-09T08:30:00.000+08:00",
  "VA 2": "2024-04-09T08:30:00.000+08:00",
  "Design & Applied Technology 1": "2024-04-10T08:30:00.000+08:00",
  "Design & Applied Technology 2": "2024-04-10T11:15:00.000+08:00",
  "Chinese 1": "2024-04-11T08:30:00.000+08:00",
  "Chinese 2": "2024-04-11T10:45:00.000+08:00",
  "English 1": "2024-04-12T08:30:00.000+08:00",
  "English 2": "2024-04-12T11:00:00.000+08:00",
  "English 3": "2024-04-13T09:15:00.000+08:00",
  "Maths 1": "2024-04-15T08:30:00.000+08:00",
  "Maths 2": "2024-04-15T11:30:00.000+08:00",
  CSD: "2024-04-16T08:30:00.000+08:00",
  "Health Management & Social Care 1": "2024-04-17T08:30:00.000+08:00",
  "Health Management & Social Care 2": "2024-04-17T11:15:00.000+08:00",
  "Chemistry 1": "2024-04-18T08:30:00.000+08:00",
  "Chemistry 2": "2024-04-18T11:45:00.000+08:00",
  "Geography 1": "2024-04-19T08:30:00.000+08:00",
  "Geography 2": "2024-04-19T12:00:00.000+08:00",
  M1: "2024-04-20T08:30:00.000+08:00",
  M2: "2024-04-20T11:15:00.000+08:00",
  "Economics 1": "2024-04-22T08:30:00.000+08:00",
  "Economics 2": "2024-04-22T10:15:00.000+08:00",
  "Chinese Literature 1": "2024-04-23T08:30:00.000+08:00",
  "Chinese Literature 2": "2024-04-23T11:15:00.000+08:00",
  "Technology & Living 1": "2024-04-23T08:30:00.000+08:00",
  "Technology & Living 2": "2024-04-23T10:45:00.000+08:00",
  "Physics 1": "2024-04-24T08:30:00.000+08:00",
  "Physics 2": "2024-04-24T11:45:00.000+08:00",
  "Chinese History 1": "2024-04-25T08:30:00.000+08:00",
  "Chinese History 2": "2024-04-25T11:30:00.000+08:00",
  "Biology 1": "2024-04-26T08:30:00.000+08:00",
  "Biology 2": "2024-04-26T11:45:00.000+08:00",
  "ICT 1": "2024-04-27T08:30:00.000+08:00",
  "ICT 2": "2024-04-27T11:15:00.000+08:00",
  "BAFS 1": "2024-04-29T08:30:00.000+08:00",
  "BAFS 2": "2024-04-29T10:30:00.000+08:00",
  "Literature in English 1": "2024-04-30T08:30:00.000+08:00",
  "Literature in English 2": "2024-04-30T13:30:00.000+08:00",
  "PE 1": "2024-04-30T08:30:00.000+08:00",
  "PE 2": "2024-04-30T11:30:00.000+08:00",
  "Music 1A": "2024-04-30T08:30:00.000+08:00",
  "Music 1B": "2024-04-30T10:45:00.000+08:00",
  "History 1": "2024-05-02T08:30:00.000+08:00",
  "History 2": "2024-05-02T11:00:00.000+08:00",
  "Ethics & Religious Studies 1": "2024-05-03T08:30:00.000+08:00",
  "Ethics & Religious Studies 2": "2024-05-03T11:00:00.000+08:00",
  "Tourism & Hospitality Studies 1": "2024-05-04T08:30:00.000+08:00",
  "Tourism & Hospitality Studies 2": "2024-05-04T11:00:00.000+08:00",
};

// Function to calculate duration before the start of an examination paper
function timeUntilExam(paper: string | null): string | null {
  const now = new Date();
  let targetPaperKey: string | null = null;

  if (paper?.trim()) {
    const trimmedPaper = paper
      .trim()
      .split(" ")
      .map((v) => v.trim())
      .join(" ");

    let match = Object.keys(timetable).find(
      (v) => v.toLowerCase() === trimmedPaper.toLowerCase(),
    );

    if (!match) {
      const paperWithSuffix = trimmedPaper + " 1";
      match = Object.keys(timetable).find(
        (v) => v.toLowerCase() === paperWithSuffix.toLowerCase(),
      );
    }
    if (match) {
      targetPaperKey = match;
    }
  } else {
    // Find the next upcoming exam
    let closestFutureTime = Infinity;
    let nextUpcomingPaper: string | null = null;
    for (const [key, value] of Object.entries(timetable)) {
      const startTime = new Date(value);
      if (startTime > now && startTime.getTime() < closestFutureTime) {
        closestFutureTime = startTime.getTime();
        nextUpcomingPaper = key;
      }
    }
    if (nextUpcomingPaper) {
      targetPaperKey = nextUpcomingPaper;
    } else {
      // If no future exams, find the most recent past one to indicate all are over
      let mostRecentPastTime = 0;
      let lastPastPaper: string | null = null;
      for (const [key, value] of Object.entries(timetable)) {
        const startTime = new Date(value);
        if (startTime <= now && startTime.getTime() > mostRecentPastTime) {
          mostRecentPastTime = startTime.getTime();
          lastPastPaper = key;
        }
      }
      targetPaperKey = lastPastPaper;
    }
  }

  if (!targetPaperKey) {
    return null; // No matching paper found or timetable is empty/invalid
  }

  const paperDisplayName = targetPaperKey;
  const startTime = new Date(timetable[targetPaperKey]);
  const duration = startTime.getTime() - now.getTime();
  const isPast = duration < 0;

  const formattedDuration = humanizeDuration(Math.abs(duration), {
    units: ["d", "h", "m"],
    round: true,
  });

  if (isPast) {
    return `HKDSE *${paperDisplayName}* examination was: ${formattedDuration} ago`;
  } else {
    return `Time until HKDSE *${paperDisplayName}* examination: ${formattedDuration}`;
  }
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  const paperArg = args.join(" ");
  const eta = timeUntilExam(paperArg.trim() ? paperArg : null);
  if (!eta) {
    return client.sendMessage(
      chatId,
      "No such paper found or all exams are over. Use !help dse to see the available papers.",
    );
  }
  return client.sendMessage(chatId, eta);
};

const command: Command = {
  name: "DSE",
  description: "Get time until examinations (2024).",
  command: "!dse",
  commandType: "plugin",
  isDependent: false,
  help: `Command: !dse [paper]

Not supplying the paper will give the closest paper in time.

*Available papers:*
${Object.keys(timetable).join("\n")}`,
  execute,
  public: true,
};

export default command;
