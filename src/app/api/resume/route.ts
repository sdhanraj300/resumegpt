// src/app/api/resume/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// LangChain and AI Imports
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { authOptions } from '@/lib/auth';

// Initialize AI clients
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API! });
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const loader = new PDFLoader(file);
    const docs = await loader.load();
    const fullResumeText = docs.map(doc => doc.pageContent).join('\n');

    if (!fullResumeText) {
      return NextResponse.json({ error: 'Could not extract text from PDF.' }, { status: 400 });
    }

    const newResume = await db.resume.create({
      data: {
        title: file.name,
        content: fullResumeText,
        userId: userId,
      },
    });
    console.log(`Saved resume ${newResume.id} to Postgres.`);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    console.log(`Split resume into ${splitDocs.length} chunks.`);

    // --- CORRECTED PINECONE LOGIC ---

    // 1. Initialize the PineconeStore with our embeddings and index
    const pineconeStore = new PineconeStore(embeddings, {
      pineconeIndex,
      namespace: userId, // Use user's ID for data isolation
      textKey: 'text',
    });

    // 2. Generate the unique IDs for each vector chunk
    const vectorIds = splitDocs.map((_, i) => `${newResume.id}_chunk_${i}`);

    // 3. Add the documents to the store with our custom IDs and metadata
    const documentsWithMetadata = splitDocs.map((doc, i) => ({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        resumeId: newResume.id,
        userId: userId,
        chunkIndex: i,
        totalChunks: splitDocs.length
      }
    }));

    await pineconeStore.addDocuments(documentsWithMetadata, {
      ids: vectorIds,
    });

    console.log(`Indexed ${splitDocs.length} chunks in Pinecone for resume ${newResume.id}.`);

    return NextResponse.json({
      message: 'Resume uploaded and indexed successfully.',
      resumeId: newResume.id,
    }, { status: 201 });

  } catch (error) {
    console.error('[RESUME_PIPELINE_ERROR]', error);
    return NextResponse.json({ error: 'Error processing your resume' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resume = await db.resume.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });
    const resumeId = resume?.id;
    if (!resumeId) {
      return NextResponse.json({ error: 'No resume found for this user' }, { status: 404 });
    }
    return NextResponse.json({ resumeId }, { status: 200 });
  } catch (error) {
    console.error('[RESUME_PIPELINE_ERROR]', error);
    return NextResponse.json({ error: 'Error processing your resume' }, { status: 500 });
  }
}