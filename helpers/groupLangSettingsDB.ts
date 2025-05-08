import db from "../db/index.js";
import { IGroupLangSetting } from "../models/groupLangSettings.js";

const COLLECTION_NAME = "groupLangSettings";

/**
 * Sets or updates the language preference for a group.
 * @param groupId The ID of the group.
 * @param targetLanguage The target language ('yue' or 'en').
 */
export async function setGroupLanguage(
  groupId: string,
  targetLanguage: "yue" | "en",
): Promise<void> {
  const { coll } = db(COLLECTION_NAME);
  await coll.updateOne(
    { groupId },
    {
      $set: { targetLanguage, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
}

/**
 * Gets the language preference for a group.
 * @param groupId The ID of the group.
 * @returns The target language ('yue' or 'en') or null if not set.
 */
export async function getGroupLanguage(
  groupId: string,
): Promise<"yue" | "en" | null> {
  const { coll } = db(COLLECTION_NAME);
  const setting = await coll.findOne<IGroupLangSetting>({ groupId });
  return setting ? setting.targetLanguage : null;
}

/**
 * Clears the language preference for a group.
 * @param groupId The ID of the group.
 */
export async function clearGroupLanguage(groupId: string): Promise<void> {
  const { coll } = db(COLLECTION_NAME);
  await coll.deleteOne({ groupId });
}
