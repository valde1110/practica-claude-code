import type { Context } from "@netlify/edge-functions";
import { handleTranscribeRequest } from "./lib/transcribe-logic.ts";

// Netlify injects this global into every edge function at runtime.
declare const Netlify: { env: { get(name: string): string | undefined } };

export default async (request: Request, _context: Context): Promise<Response> => {
  const apiKey = Netlify.env.get("GROQ_API_KEY");
  return handleTranscribeRequest(request, { apiKey, fetchImpl: fetch });
};

export const config = { path: "/api/transcribe" };
