// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Server-side Gemini client (the API key never leaves the backend)
// TODO: Write the classify and project-plan prompts and parse structured JSON output

import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env';
import { HttpError } from '../../middleware/errorHandler';

let client: GoogleGenAI | null = null;

/** Lazily creates the Gemini client so the API can start without a key. */
export function getGemini(): GoogleGenAI {
  if (!env.geminiApiKey)
    throw new HttpError(503, 'AI features are not configured (GEMINI_API_KEY missing)');
  client ??= new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
}

export const geminiModel = env.geminiModel;
