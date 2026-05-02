export interface DatabaseChatMessage {
  message_id: number;
  user_id: number;
  message: string;
  sender: 'user' | 'ai';
  session_id: string;
  created_at: Date;
}

export interface DatabaseChatMessageResponse {
  message_id: number;
  message: string;
  sender: 'user' | 'ai';
  session_id: string;
  created_at: Date;
}

export interface SendMessageBody {
  message: string;
  session_id: string;
}

export interface ChatHistoryQuery {
  limit?: string;
  offset?: string;
  session_id?: string;
}

export interface SendMessageResponse {
  user_message: DatabaseChatMessageResponse;
  ai_message: DatabaseChatMessageResponse;
  session_id: string;
}

export interface ChatHistoryResponse {
  messages: DatabaseChatMessageResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GrokChatRequest {
  model: string;
  messages: GrokMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface GrokChatResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatMessage {        
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatRequest {   
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface ChatMessageResponse {  
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}