// src/app/api/chat/route.ts
import { NextRequest } from 'next/server';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from '@langchain/core/documents';
import { getModel } from '@/lib/gemini';
import { getEmbeddings, getPineconeClient } from '@/lib/pinecone';
import Error from 'next/error';

export const runtime = 'nodejs';

declare global {
  var pinecone: Pinecone | undefined;
  var embeddings: GoogleGenerativeAIEmbeddings | undefined;
  var model: ChatGoogleGenerativeAI | undefined;
}

type IncomingChatMessage = { role: 'user' | 'assistant'; content: string };

const formatMessage = (message: IncomingChatMessage): BaseMessage => {
  return message.role === 'user'
    ? new HumanMessage(message.content)
    : new AIMessage(message.content);
};

const TEMPLATE = `You are an expert career coach analyzing a resume. Your task is to provide clear, concise, and accurate information based on the resume content.

Resume Content:
{context}

Chat History:
{chat_history}

User's Question: {question}

Guidelines for your response:
1. Be specific and extract information directly from the resume
2. If the information isn't in the resume, say "The resume doesn't mention this information"
3. For skills and technologies, list them in order of prominence in the resume
4. Keep your response focused and to the point
5. Format lists with bullet points for better readability
6. If you don't know the answer, say "The resume doesn't mention this information"
7. Keep response short and crisp.

Response:`;

const prompt = PromptTemplate.fromTemplate(TEMPLATE);

interface ChatRequest {
  messages: IncomingChatMessage[];
  userId: string;
  resumeId: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId, resumeId } = await req.json() as ChatRequest;
    if (!messages?.length || !userId || !resumeId) {
      return new Response(
        JSON.stringify({ message: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const pinecone = getPineconeClient();
      const embeddingsInstance = getEmbeddings();
      const modelInstance = getModel();

      const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

      const vectorStore = new PineconeStore(embeddingsInstance, {
        pineconeIndex,
        namespace: userId,
        textKey: 'text',
      });

      const retriever = vectorStore.asRetriever({
        k: 5,
        filter: {}
      });

      const currentMessage = messages[messages.length - 1];
      const currentMessageContent = currentMessage.content;
      const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);

      const relevantDocs = await retriever.getRelevantDocuments(currentMessageContent);


      if (relevantDocs.length === 0) {
        console.warn('No relevant document chunks found');
        return new Response(
          JSON.stringify({
            message: "I couldn't find any relevant information in your resume. Please make sure you've uploaded your resume and try again."
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }


      const context = relevantDocs
        .map((doc: Document, i: number) => `--- Chunk ${i + 1} ---\n${doc.pageContent}`)
        .join('\n\n');



      // Format chat history as a conversation string
      const chatHistoryString = formattedPreviousMessages
        .map(msg =>
          msg._getType() === 'human'
            ? `User: ${msg.content}`
            : `Assistant: ${msg.content}`
        )
        .join('\n');

      const chain = RunnableSequence.from([
        {
          context: () => context,
          chat_history: () => chatHistoryString,
          question: () => currentMessageContent,
        },
        prompt,
        modelInstance,
        new StringOutputParser(),
      ]);

      const stream = await chain.stream({
        question: currentMessageContent,
        chat_history: chatHistoryString,
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });

    } catch (error) {
      console.error('Error processing chat request:', error);
      return new Response(
        JSON.stringify({
          message: 'An error occurred while processing your request. Please try again.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);
    return new Response(
      JSON.stringify({
        message: `An unexpected error occurred: ${error || 'Please try again later.'}`
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}