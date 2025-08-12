import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const getModel = (): ChatGoogleGenerativeAI => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    if (!global.model) {
        global.model = new ChatGoogleGenerativeAI({
            model: 'gemini-2.5-flash',
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0.5,
        });
    }

    return global.model;
};