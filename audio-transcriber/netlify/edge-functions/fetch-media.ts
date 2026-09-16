import type { Context } from "@netlify/edge-functions";
import { handleFetchUrlRequest } from "./lib/fetch-media-logic.ts";

export default async (request: Request, _context: Context): Promise<Response> => {
  return handleFetchUrlRequest(request, { fetchImpl: fetch });
};

export const config = { path: "/api/fetch-url" };
