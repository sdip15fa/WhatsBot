import humanizeDuration from "humanize-duration";
import { Client, Message } from "whatsapp-web.js";

const timetable: { [key: string]: string } = {
  "VA 1": "20240409T08:30:00.000+08:00",
  "VA 2": "20240409T08:30:00.000+08:00",
  "Design & Applied Technology 1": "20240410T08:30:00.000+08:00",
  "Design & Applied Technology 2": "20240410T11:15:00.000+08:00",
  "Chinese 1": "20240411T08:30:00.000+08:00",
  "Chinese 2": "20240411T10:45:00.000+08:00",
  "English 1": "20240412T08:30:00.000+08:00",
  "English 2": "20240412T11:00:00.000+08:00",
  "English 3": "20240413T09:15:00.000+08:00",
  "Maths 1": "20240415T08:30:00.000+08:00",
  "Maths 2": "20240415T11:30:00.000+08:00",
  CSD: "20240416T08:30:00.000+08:00",
  "Health Management & Social Care 1": "20240417T08:30:00.000+08:00",
  "Health Management & Social Care 2": "20240417T11:15:00.000+08:00",
  "Chemistry 1": "20240418T08:30:00.000+08:00",
  "Chemistry 2": "20240418T11:45:00.000+08:00",
  "Geography 1": "20240419T08:30:00.000+08:00",
  "Geography 2": "20240419T12:00:00.000+08:00",
  M1: "20240420T08:30:00.000+08:00",
  M2: "20240420T11:15:00.000+08:00",
  "Economics 1": "20240422T08:30:00.000+08:00",
  "Economics 2": "20240422T10:15:00.000+08:00",
  "Chinese Literature 1": "20240423T08:30:00.000+08:00",
  "Chinese Literature 2": "20240423T11:15:00.000+08:00",
  "Technology & Living 1": "20240423T08:30:00.000+08:00",
  "Technology & Living 2": "20240423T10:45:00.000+08:00",
  "Physics 1": "20240424T08:30:00.000+08:00",
  "Physics 2": "20240424T11:45:00.000+08:00",
  "Chinese History 1": "20240425T08:30:00.000+08:00",
  "Chinese History 2": "20240425T11:30:00.000+08:00",
  "Biology 1": "20240426T08:30:00.000+08:00",
  "Biology 2": "20240426T11:45:00.000+08:00",
  "ICT 1": "20240427T08:30:00.000+08:00",
  "ICT 2": "20240427T11:15:00.000+08:00",
  "BAFS 1": "20240429T08:30:00.000+08:00",
  "BAFS 2": "20240429T10:30:00.000+08:00",
  "Literature in English 1": "20240430T08:30:00.000+08:00",
  "Literature in English 2": "20240430T13:30:00.000+08:00",
  "PE 1": "20240430T08:30:00.000+08:00",
  "PE 2": "20240430T11:30:00.000+08:00",
  "Music 1A": "20240430T08:30:00.000+08:00",
  "Music 1B": "20240430T10:45:00.000+08:00",
  "History 1": "20240502T08:30:00.000+08:00",
  "History 2": "20240502T11:00:00.000+08:00",
  "Ethics & Religious Studies 1": "20240503T08:30:00.000+08:00",
  "Ethics & Religious Studies 2": "20240503T11:00:00.000+08:00",
  "Tourism & Hospitality Studies 1": "20240504T08:30:00.000+08:00",
  "Tourism & Hospitality Studies 2": "20240504T11:00:00.000+08:00",
};

// Function to calculate duration before the start of an examination paper
function timeUntilExam(paper: string = null) {
  // If no paper is specified, find the paper with the earliest starting time
  if (!paper) {
    let earliestTime = Infinity;
    let earliestPaper = null;
    for (const key in timetable) {
      const startTime = new Date(timetable[key]);
      if (startTime.getDate() < earliestTime) {
        earliestTime = startTime.getTime();
        earliestPaper = key;
      }
    }
    paper = earliestPaper;
  }

  paper = paper
    .trim()
    .split(" ")
    .map((v) => v.trim())
    .join(" ");

  let match = Object.keys(timetable).find(
    (v) => v.toLowerCase() === paper.toLowerCase(),
  );
  if (!match) {
    paper = paper.trim() + " 1";
    match = Object.keys(timetable).find(
      (v) => v.toLowerCase() === paper.toLowerCase(),
    );
  }
  if (!match) {
    return null;
  }
  // Calculate the duration until the start of the examination paper
  const currentTime = new Date();
  const startTime = new Date(timetable[paper]);
  const duration = startTime.getTime() - currentTime.getTime();

  // Format the duration using humanize-duration
  const formattedDuration = humanizeDuration(duration, {
    units: ["d", "h", "m"],
    round: true,
  });

  return `Time until ${paper}: ${formattedDuration}`;
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  const paper = args.join(" ");
  const eta = timeUntilExam(paper.trim() ? paper : null);
  if (!eta) {
    return client.sendMessage(
      chatId,
      "No such paper found. Use !help dse to see the available papers.",
    );
  }
  return client.sendMessage(chatId, eta);
};

export default {
  name: "DSE",
  description: "Get time until examinations (2024).",
  command: "!dse",
  commandType: "plugin",
  isDependent: false,
  help: `!dse [paper]

Not supplying the paper will give the earliest paper.

*Available papers:*
${Object.keys(timetable).join("\n")}`,
  execute,
  public: true,
};
