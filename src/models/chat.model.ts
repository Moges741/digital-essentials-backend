import db from '../config/db'; 
import { ChatMessage, ChatMessageResponse } from '../types/chat.types';

const TABLE = 'chat_messages';


export const saveMessage = async (
  userId: number,
  message: string,
  sender: 'user' | 'ai',
  sessionId: string
): Promise<ChatMessageResponse> => {
  const [insertedId] = await db(TABLE).insert({
    user_id: userId,
    message,
    sender,
    session_id: sessionId,
  });

  // MySQL returns the auto-increment id; we need the full row
  const row = await db(TABLE)
    .where({ user_id: userId, session_id: sessionId, sender })
    .orderBy('created_at', 'desc')
    .first<ChatMessage>();

  return {
    message_id: row.message_id,
    message: row.message,
    sender: row.sender,
    session_id: row.session_id,
    created_at: row.created_at,
  };
};


export const getUserChatHistory = async (
  userId: number,
  limit: number,
  offset: number,
  sessionId?: string
): Promise<{ messages: ChatMessageResponse[]; total: number }> => {
  const baseQuery = db(TABLE).where({ user_id: userId });

  if (sessionId) {
    baseQuery.andWhere({ session_id: sessionId });
  }

  const [{ count }] = await baseQuery
    .clone()
    .count('message_id as count');

  // Fetch page
  const rows = await baseQuery
    .clone()
    .select('message_id', 'message', 'sender', 'session_id', 'created_at')
    .orderBy('created_at', 'asc')
    .limit(limit)
    .offset(offset);

  return {
    messages: rows as ChatMessageResponse[],
    total: Number(count),
  };
};


export const getRecentMessages = async (
  userId: number,
  sessionId: string,
  limit: number = 10
): Promise<ChatMessage[]> => {
  const rows = await db(TABLE)
    .where({ user_id: userId, session_id: sessionId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .select<ChatMessage[]>();

  return rows.reverse(); 
};


export const deleteUserHistory = async (
  userId: number,
  sessionId?: string
): Promise<number> => {
  const query = db(TABLE).where({ user_id: userId });

  if (sessionId) {
    query.andWhere({ session_id: sessionId });
  }

  return query.delete();
};


export const countUserMessagesToday = async (
  userId: number
): Promise<number> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ count }] = await db(TABLE)
    .where({ user_id: userId, sender: 'user' })
    .andWhere('created_at', '>=', startOfDay)
    .count('message_id as count');

  return Number(count);
};