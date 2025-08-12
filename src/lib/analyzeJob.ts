// src/lib/ai/analysis.ts

import { getModel } from './gemini';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { z } from 'zod';
import { StructuredOutputParser } from 'langchain/output_parsers';

// 1. Define the Zod schema for our desired output.
// This tells the AI exactly what structure to return.
const requirementsSchema = z.object({
    requirements: z
        .array(z.string())
        .describe(
            'An array of the top 5-7 most important requirements, skills, or qualifications from the job description.'
        ),
});

// 2. Create a parser that will use the Zod schema.
// It will also generate the formatting instructions for the prompt.
const parser = StructuredOutputParser.fromZodSchema(requirementsSchema);

const getExtractionChain = () => {
    // 3. Create a new, more specific prompt template.
    // We include the parser's generated format instructions.
    const template = `You are an expert AI assistant specializing in recruitment and job analysis.
  Your task is to extract the key requirements from a job description.

  Analyze the following job description and extract the most important requirements.
  Focus on specific skills (e.g., "React", "Python"), years of experience (e.g., "5+ years of experience"), and key responsibilities (e.g., "managing a team").
  Job Description: {jobDescription}

  {format_instructions}
  `;

    const prompt = PromptTemplate.fromTemplate(template, {
        partialVariables: { format_instructions: parser.getFormatInstructions() },
    });

    const model = getModel();
    // 4. Create the chain, now piping to the new parser.
    return RunnableSequence.from([
        prompt,
        model,
        parser,
    ]);
};

// This is our new, improved function.
export const extractKeyRequirements = async (content: string): Promise<string[]> => {
    const chain = getExtractionChain();
    const result = await chain.invoke({
        jobDescription: content,
        format_instructions: parser.getFormatInstructions()
    });

    // The result is now a guaranteed JavaScript object, not just a string.
    return result.requirements;
};