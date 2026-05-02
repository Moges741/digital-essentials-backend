import { Request, Response, NextFunction } from 'express';
import { processChat, getChatHistory, clearHistory } from '../services/chat.service';
import { sendSuccess, sendError } from '../utils/response'; // your existing helpers
import { SendMessageBody, ChatHistoryQuery } from '../types/chat.types';


export const sendMessageController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id; // set by authenticate middleware
    const { message, session_id }: SendMessageBody = req.body;

    const result = await processChat(userId, message.trim(), session_id);

    sendSuccess(res, result, 'Message sent successfully', 201);
  } catch (error) {
    next(error);
  }
};


export const getHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { limit, offset, session_id }: ChatHistoryQuery = req.query as ChatHistoryQuery;

    const parsedLimit = Math.min(parseInt(limit || '20', 10), 100); // cap at 100
    const parsedOffset = parseInt(offset || '0', 10);

    const history = await getChatHistory(
      userId,
      parsedLimit,
      parsedOffset,
      session_id
    );

    sendSuccess(res, history, 'Chat history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/chat/history
 * Clear the user's chat history.
 * Query param: session_id (optional — clears only that session if provided)
 * Admin/mentor can also call this (route-level role config handles that).
 */
export const clearHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { session_id } = req.query as { session_id?: string };

    const result = await clearHistory(userId, session_id);

    sendSuccess(res, result, 'Chat history cleared successfully');
  } catch (error) {
    next(error);
  }
};