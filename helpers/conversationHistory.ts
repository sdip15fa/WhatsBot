import db from "../db/index.js";

export interface ConversationMessage {
  role: "user" | "assistant" | "model" | "system";
  content: string;
  timestamp: number;
  imageData?: {
    inlineData: {
      data: string;
      mimeType: string;
    };
  };
}

export interface Conversation {
  chatId: string;
  model: string; // gemini, gpt, llama, ds, evilllama
  messages: ConversationMessage[];
  lastUpdated: number;
  createdAt: number;
}

const COLLECTION_NAME = "ai_conversations";
const MAX_MESSAGES_PER_CHAT = 50; // Limit conversation history
const AUTO_CLEANUP_DAYS = 7; // Auto-delete conversations older than 7 days

/**
 * Get conversation history for a specific chat and model
 */
export async function getConversationHistory(
  chatId: string,
  model: string
): Promise<ConversationMessage[]> {
  try {
    const conversation = await db(COLLECTION_NAME).coll.findOne<Conversation>({
      chatId,
      model,
    });

    if (!conversation) {
      return [];
    }

    // Auto-cleanup old conversations
    const daysOld =
      (Date.now() - conversation.lastUpdated) / (1000 * 60 * 60 * 24);
    if (daysOld > AUTO_CLEANUP_DAYS) {
      await clearConversation(chatId, model);
      return [];
    }

    return conversation.messages || [];
  } catch (error) {
    console.error("Error getting conversation history:", error);
    return [];
  }
}

/**
 * Add a message to conversation history
 */
export async function addMessageToHistory(
  chatId: string,
  model: string,
  message: ConversationMessage
): Promise<void> {
  try {
    const conversation = await db(COLLECTION_NAME).coll.findOne<Conversation>({
      chatId,
      model,
    });

    const now = Date.now();

    if (!conversation) {
      // Create new conversation
      await db(COLLECTION_NAME).coll.insertOne({
        chatId,
        model,
        messages: [message],
        lastUpdated: now,
        createdAt: now,
      });
    } else {
      // Update existing conversation
      const messages = conversation.messages || [];
      messages.push(message);

      // Keep only last MAX_MESSAGES_PER_CHAT messages
      const trimmedMessages =
        messages.length > MAX_MESSAGES_PER_CHAT
          ? messages.slice(-MAX_MESSAGES_PER_CHAT)
          : messages;

      await db(COLLECTION_NAME).coll.updateOne(
        { chatId, model },
        {
          $set: {
            messages: trimmedMessages,
            lastUpdated: now,
          },
        }
      );
    }
  } catch (error) {
    console.error("Error adding message to history:", error);
  }
}

/**
 * Clear conversation history for a specific chat and model
 */
export async function clearConversation(
  chatId: string,
  model?: string
): Promise<number> {
  try {
    const query: any = { chatId };
    if (model) {
      query.model = model;
    }

    const result = await db(COLLECTION_NAME).coll.deleteMany(query);
    return result.deletedCount || 0;
  } catch (error) {
    console.error("Error clearing conversation:", error);
    return 0;
  }
}

/**
 * Get all conversations for a chat (across all models)
 */
export async function getAllConversations(
  chatId: string
): Promise<Conversation[]> {
  try {
    const conversations = await db(COLLECTION_NAME)
      .coll.find<Conversation>({ chatId })
      .toArray();
    return conversations;
  } catch (error) {
    console.error("Error getting all conversations:", error);
    return [];
  }
}

/**
 * Export conversation history as text
 */
export async function exportConversation(
  chatId: string,
  model: string
): Promise<string> {
  try {
    const conversation = await db(COLLECTION_NAME).coll.findOne<Conversation>({
      chatId,
      model,
    });

    if (!conversation || !conversation.messages.length) {
      return "No conversation history found.";
    }

    let exportText = `Conversation with ${model.toUpperCase()}\n`;
    exportText += `Started: ${new Date(conversation.createdAt).toLocaleString()}\n`;
    exportText += `Last updated: ${new Date(conversation.lastUpdated).toLocaleString()}\n`;
    exportText += `Messages: ${conversation.messages.length}\n\n`;
    exportText += "=" .repeat(50) + "\n\n";

    conversation.messages.forEach((msg, index) => {
      const role = msg.role === "user" ? "You" : model.toUpperCase();
      const time = new Date(msg.timestamp).toLocaleTimeString();
      exportText += `[${time}] ${role}:\n${msg.content}\n\n`;
    });

    return exportText;
  } catch (error) {
    console.error("Error exporting conversation:", error);
    return "Error exporting conversation.";
  }
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(chatId: string): Promise<{
  totalModels: number;
  totalMessages: number;
  models: { model: string; messageCount: number; lastUsed: number }[];
}> {
  try {
    const conversations = await getAllConversations(chatId);

    const models = conversations.map((conv) => ({
      model: conv.model,
      messageCount: conv.messages.length,
      lastUsed: conv.lastUpdated,
    }));

    const totalMessages = conversations.reduce(
      (sum, conv) => sum + conv.messages.length,
      0
    );

    return {
      totalModels: conversations.length,
      totalMessages,
      models,
    };
  } catch (error) {
    console.error("Error getting conversation stats:", error);
    return {
      totalModels: 0,
      totalMessages: 0,
      models: [],
    };
  }
}

/**
 * Cleanup old conversations (run periodically)
 */
export async function cleanupOldConversations(): Promise<number> {
  try {
    const cutoffDate = Date.now() - AUTO_CLEANUP_DAYS * 24 * 60 * 60 * 1000;

    const result = await db(COLLECTION_NAME).coll.deleteMany({
      lastUpdated: { $lt: cutoffDate },
    });

    return result.deletedCount || 0;
  } catch (error) {
    console.error("Error cleaning up old conversations:", error);
    return 0;
  }
}
