import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not defined in environment variables');
}

export const groqClient = axios.create({
  baseURL: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
  },
  timeout: 30000,
});

export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama3-8b-8192';
export const DAILY_MESSAGE_LIMIT = parseInt(
  process.env.DAILY_MESSAGE_LIMIT || '100',
  10
);

export const CHAT_SYSTEM_PROMPT = `You are a helpful digital literacy tutor for the Digital Essentials Platform, a community learning platform in Jimma, Ethiopia. Your role is to help learners develop essential digital skills.

Your responsibilities:
- Explain digital concepts clearly and simply (many users are beginners)
- Help with course content, exercises, and quizzes on the platform
- Guide learners on smartphone usage, internet safety, and productivity tools
- Be patient, encouraging, and use simple language
- If asked about things unrelated to digital learning, gently redirect to the platform's topics
- Keep responses concise and practical

You support learners at all skill levels — from absolute beginners learning to use a smartphone to advanced users exploring online safety tools.`;