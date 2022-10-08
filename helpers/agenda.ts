import { Agenda, Job } from "agenda";
import db, { client } from "../db";
import { wtsClient } from "../main";
import { getDate } from "./date";

export const agenda = new Agenda({ mongo: client.db("agenda") });

agenda.define("send count", async (job: Job) => {
  const { groupId } = job.attrs.data;
  const date = getDate();
  const count = (
    await db("count").coll.findOne({
      groupId,
      date,
    })
  )?.count;

  if (count) {
    wtsClient.sendMessage(
      groupId,
      `Messages ${date}:
${count}`
    );
  }
});
