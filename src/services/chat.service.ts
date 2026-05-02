import { v4 as uuidv4 } from 'uuid';
import {
  groqClient,           // renamed from grokClient
  GROQ_MODEL,           // renamed from GROK_MODEL
  DAILY_MESSAGE_LIMIT,
  CHAT_SYSTEM_PROMPT,
} from '../config/groq'; // renamed from ../config/grok
import {
  saveMessage,
  getUserChatHistory,
  deleteUserHistory,
  countUserMessagesToday,
  getRecentMessages,
} from '../models/chat.model';
import {
  SendMessageResponse,
  ChatHistoryResponse,
  GrokMessage,         // reuse this type — same shape
  GroqChatRequest,
  GrokChatResponse,
} from '../types/chat.types';
import { AppError } from '../utils/errors';

/**
 * Call the Groq API — identical format to OpenAI/Grok.
 * Only the client instance and model name differ.
 */
const callGroqAPI = async (messages: GrokMessage[]): Promise<string> => {
  const payload: GroqChatRequest = {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      ...messages,
    ],
    max_tokens: 1000,
    temperature: 0.7,
  };

  try {
    const response = await groqClient.post<GrokChatResponse>(
      '/chat/completions',
      payload
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq API');
    }

    return content.trim();
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.error?.message || 'Groq API error';

      if (status === 429) {
        throw new AppError(
          'AI service is busy, please try again in a moment',
          429
        );
      }
      if (status === 401) {
        throw new AppError('Invalid Groq API key', 500);
      }
      if (status >= 500) {
        throw new AppError('AI service is temporarily unavailable', 503);
      }

      throw new AppError(message, status);
    }

    if (error.code === 'ECONNABORTED') {
      throw new AppError('AI service timed out, please try again', 504);
    }

    throw new AppError('Failed to reach AI service', 503);
  }
};

/**
 * Main chat handler — unchanged from Grok version.
 */
export const processChat = async (
  userId: number,
  userMessage: string,
  sessionId?: string
): Promise<SendMessageResponse> => {
  // 1. Rate limit check
  const todayCount = await countUserMessagesToday(userId);
  if (todayCount >= DAILY_MESSAGE_LIMIT) {
    throw new AppError(
      `Daily message limit of ${DAILY_MESSAGE_LIMIT} reached. Please try again tomorrow.`,
      429
    );
  }

  // 2. Use provided session or start a new one
  const activeSessionId = sessionId || uuidv4();

  // 3. Save user message before calling API
  const savedUserMessage = await saveMessage(
    userId,
    userMessage,
    'user',
    activeSessionId
  );

  // 4. Build context from recent history (last 10 messages)
  const recentMessages = await getRecentMessages(userId, activeSessionId, 10);
  const groqMessages: GrokMessage[] = recentMessages.map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.message,
  }));

  // 5. Call Groq
  let aiReplyText: string;
  try {
    aiReplyText = await callGroqAPI(groqMessages);
  } catch (error) {
    throw error;
  }

  // 6. Save AI response
  const savedAiMessage = await saveMessage(
    userId,
    aiReplyText,
    'ai',
    activeSessionId
  );

  return {
    user_message: savedUserMessage,
    ai_message: savedAiMessage,
    session_id: activeSessionId,
  };
};

/**
 * Retrieve paginated chat history — unchanged.
 */
export const getChatHistory = async (
  userId: number,
  limit: number,
  offset: number,
  sessionId?: string
): Promise<ChatHistoryResponse> => {
  const { messages, total } = await getUserChatHistory(
    userId,
    limit,
    offset,
    sessionId
  );

  return { messages, total, limit, offset };
};

/**
 * Clear history — unchanged.
 */
export const clearHistory = async (
  userId: number,
  sessionId?: string
): Promise<{ deleted: number }> => {
  const deleted = await deleteUserHistory(userId, sessionId);
  return { deleted };
};