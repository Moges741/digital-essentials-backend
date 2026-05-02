export interface GroqMessage {        
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatRequest {   
  model: string;
  messages: GroqMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface GroqChatResponse {  
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