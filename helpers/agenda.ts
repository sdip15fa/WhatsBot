import { Agenda, Job } from "agenda";
import whatsapp from "whatsapp-web.js";
import { client } from "../db/index.js";
import { wtsClient } from "../main.js";
import { countMessage } from "./count.js";
import { getDate } from "./date.js";
const { MessageMedia } = whatsapp;

export const agenda = new Agenda({ mongo: client.db("agenda") });

agenda.define(
  "send count",
  async (
    job: Job & {
      attrs: {
        data: {
          groupId: string;
        };
      };
    },
  ) => {
    const { groupId } = job.attrs.data;
    const date = getDate();

    wtsClient.sendMessage(
      groupId,
      await countMessage(
        groupId,
        (await wtsClient.getChatById(groupId))?.name || "",
        date,
      ),
    );
  },
);

agenda.define(
  "send message",
  async (
    job: Job & {
      attrs: {
        data: {
          chatId?: string;
          chats?: string[];
          body?: string;
          sticker?: boolean;
          media?: {
            mimetype: string;
            data: string;
            filename: string;
          };
        };
      };
    },
  ) => {
    const { chatId, body, sticker, media } = job.attrs.data;
    let { chats } = job.attrs.data;
    if (!chatId && !chats?.length) return;
    if (!body && !media) return;
    chats = chats || [chatId];
    await Promise.all(
      chats.map(async (chatId) => {
        if (media) {
          const messageMedia = new MessageMedia(
            media.mimetype,
            media.data,
            media.filename || "image.png",
          );
          if (sticker) {
            return await wtsClient.sendMessage(chatId, messageMedia, {
              sendMediaAsSticker: true,
            });
          }
          if (!body) {
            return await wtsClient.sendMessage(chatId, media);
          }
        }
        try {
          await wtsClient.sendMessage(chatId, body, {
            ...(media && {
              media: new MessageMedia(
                media.mimetype,
                media.data,
                media.filename,
              ),
            }),
          });
        } catch {}
      }),
    );
  },
);
