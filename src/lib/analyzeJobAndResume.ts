// src/lib/ai/analysis.ts
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { getModel } from './gemini';

// --- INITIALIZE CLIENTS ---
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API! });
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GEMINI_API_KEY! });


const matchSchema = z.object({
  isMatch: z.boolean().describe("Does the resume excerpt strongly match the job requirement?"),
  justification: z.string().describe("A brief, one-sentence explanation for the decision."),
  score: z.number().min(0).max(10).describe("A score from 0-10 indicating the strength of the match."),
});

const finalReportSchema = z.object({
  overallScore: z.number().min(0).max(100).describe("Overall percentage match score."),
  strengths: z.array(z.string()).describe("A list of 3-5 key strengths where the resume aligns well with the job."),
  gaps: z.array(z.string()).describe("A list of 3-5 key gaps or areas where the resume is weakest."),
  suggestions: z.string().describe("A paragraph of actionable suggestions for the user to improve their resume for this specific job."),
});

export const analyzeJobAndResume = async (jobRequirements: string[], userId: string, resumeId: number) => {
  // Initialize the retriever for the specific user and resume
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace: userId,
  });



  const retriever = vectorStore.asRetriever({
    filter: { resumeId: resumeId }
  });

  console.log("retriever", retriever);


  const model = getModel();

  const detailedAnalysis = [];

  // STAGE 2: The RAG Loop - Compare each requirement
  // console.log("Starting RAG loop for analysis...");
  for (const requirement of jobRequirements) {
    const relevantDocs = await retriever.invoke(requirement);
    const context = relevantDocs.map(doc => doc.pageContent).join('\n---\n');


    const comparisonTemplate = `You are a career coach. Compare a job requirement with excerpts from a candidate's resume.
    {format_instructions}
    Job Requirement: "{requirement}"
    Resume Excerpts:
    ---
    {context}
    ---`;


    const comparisonParser = StructuredOutputParser.fromZodSchema(matchSchema);


    const comparisonPrompt = PromptTemplate.fromTemplate(comparisonTemplate, {
      partialVariables: { format_instructions: comparisonParser.getFormatInstructions() },
    });


    const comparisonChain = RunnableSequence.from([comparisonPrompt, model, comparisonParser]);

    const result = await comparisonChain.invoke({ requirement, context, format_instructions: comparisonParser.getFormatInstructions() });
    detailedAnalysis.push({ requirement, ...result });
  }
  // console.log("Finished RAG loop. Starting final synthesis...");

  // STAGE 3: Synthesize the final report
  const finalReportParser = StructuredOutputParser.fromZodSchema(finalReportSchema);
  const summaryTemplate = `You are a senior career advisor. Synthesize the following detailed analysis points into a single, user-friendly report.
  The analysis compares a resume against key job requirements.
  {format_instructions}
  Detailed Analysis Points (JSON):
  ---
  {detailedAnalysis}
  ---`;
  const summaryPrompt = PromptTemplate.fromTemplate(summaryTemplate, {
    partialVariables: { format_instructions: finalReportParser.getFormatInstructions() },
  });
  const summaryChain = RunnableSequence.from([summaryPrompt, model, finalReportParser]);

  const finalReport = await summaryChain.invoke({ detailedAnalysis: JSON.stringify(detailedAnalysis), format_instructions: finalReportParser.getFormatInstructions() });



  // console.log("Final report generated.");

  return finalReport;
};