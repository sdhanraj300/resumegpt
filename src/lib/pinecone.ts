import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";

export const getPineconeClient = (): Pinecone => {
    if (!process.env.PINECONE_API) {
        throw new Error('PINECONE_API environment variable is not set');
    }

    if (!global.pinecone) {
        global.pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API,
        });
    }

    return global.pinecone;
};

export const getEmbeddings = (): GoogleGenerativeAIEmbeddings => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    if (!global.embeddings) {
        global.embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
        });
    }

    return global.embeddings;
};  