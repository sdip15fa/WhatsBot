import db from "../db";
import { Count } from "../models/count";

async function getCount(groupId: string, date: string) {
  const count = (await db("count").coll.findOne({ groupId, date })) as Count;
  if (!count) {
    return null;
  }
  return count;
}

export async function countMessage(
  chatId: string,
  chatName: string,
  date: string
) {
  const count = await getCount(chatId, date);
  if (!count) {
    return `Count not available or date invalid.`;
  }

  return `Number of messages in ${chatName} on ${date}:
${count.count}${
    count.users
      ? `\n\n*Leaderboard*
${count.users
  .sort((a, b) => b.count - a.count)
  .filter((_v, i) => i < 10)
  .map(
    (user, index) =>
      `${index + 1}. ${user.name}: ${user.count} (${user.words || 0} words) (${
        (user.count / count.count) * 100
      }%)`
  )
  .join("\n")}`
      : ""
  }`;
}
