import { GoogleGenAI } from "@google/genai";

console.log("GEMINI_API_KEY exists:", Boolean(process.env.GEMINI_API_KEY));
console.log(
  "GEMINI_API_KEY length:",
  process.env.GEMINI_API_KEY?.length
);

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing!");
}

const ai = new GoogleGenAI({
  apiKey: apiKey,
});

export default ai;