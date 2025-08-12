// src/app/api/job/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { getModel } from '@/lib/gemini'; // <-- Import the centralized model

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Types
interface JobResponse {
    success: boolean;
    message: string;
    jobId?: string;
    title?: string;
    error?: string;
}

// Helper Functions
const generateJobTitle = async (jobDescription: string): Promise<string> => {
    const template = `Generate a concise, professional job title (max 7 words) from the following job description.
    Focus on the primary role and seniority. Only return the job title itself, with no extra text or quotation marks.

    Job Description:
    ---
    {jobDescription}
    ---
    Job Title:`;

    const prompt = PromptTemplate.fromTemplate(template);
    const model = getModel();
    const chain = RunnableSequence.from([
        prompt,
        model,
        new StringOutputParser(),
    ]);

    const result = await chain.invoke({ jobDescription });
    return result.trim();
};

const createJobInDb = async (content: string, userId: string) => {
    const title = await generateJobTitle(content);
    const job = await db.job.create({
        data: { title, content, userId },
    });
    return { id: job.id, title };
};

// Response handlers (unchanged)
const createErrorResponse = (message: string, status = 400): NextResponse<JobResponse> => {
    return NextResponse.json({ success: false, error: message, message: 'Job processing failed' }, { status });
};
const createSuccessResponse = (jobId: string, title: string): NextResponse<JobResponse> => {
    return NextResponse.json({ success: true, message: 'Job processed successfully', jobId, title });
};

// Content processors
const processTextContent = async (text: string, userId: string) => {
    if (!text) return createErrorResponse('Text content is required');
    try {
        const { id, title } = await createJobInDb(text, userId);
        return createSuccessResponse(id.toString(), title);
    } catch (error) {
        console.error('Error creating job from text:', error);
        return createErrorResponse('Failed to create job', 500);
    }
};

const processFileContent = async (file: File, userId: string) => {
    if (file.size > MAX_FILE_SIZE) return createErrorResponse('File size exceeds 10MB limit');
    if (file.type !== 'application/pdf') return createErrorResponse('Only PDF files are allowed');

    try {
        const loader = new PDFLoader(file);
        const docs = await loader.load();
        const fullText = docs.map(doc => doc.pageContent).join('\n\n');
        return await processTextContent(fullText, userId);
    } catch (error) {
        console.error('Error processing PDF:', error);
        return createErrorResponse('Failed to process PDF file', 500);
    }
};

// Main POST Handler
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return createErrorResponse('Unauthorized', 401);
    }
    const userId = session.user.id;
    const contentType = request.headers.get('content-type') || '';

    try {
        if (contentType.includes('application/json')) {
            const { text } = await request.json();
            return processTextContent(text, userId);
        } else if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File | null;
            if (!file) return createErrorResponse('No file provided in form data');
            return processFileContent(file, userId);
        } else {
            return createErrorResponse(`Unsupported content type: ${contentType}`, 415);
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return createErrorResponse('An unexpected error occurred', 500);
    }
}