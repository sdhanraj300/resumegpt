// src/app/api/analytics/comprehensive/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getModel } from "@/lib/gemini";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

// Schema for structured analytics output
const analyticsSchema = z.object({
  atsScore: z
    .number()
    .min(0)
    .max(100)
    .describe("ATS compatibility score (0-100)"),
  skillsAnalysis: z.object({
    totalSkills: z.number().describe("Total number of skills identified"),
    demandedSkills: z.number().describe("Number of in-demand skills"),
    missingSkills: z
      .array(z.string())
      .describe("List of missing high-demand skills"),
    strongSkills: z
      .array(z.string())
      .describe("List of strong/valuable skills found"),
  }),
  industryBenchmark: z.object({
    score: z.number().min(0).max(100).describe("Industry percentile score"),
    ranking: z
      .string()
      .describe("Relative ranking (e.g., 'Top 20%', 'Above Average')"),
    improvements: z
      .array(z.string())
      .describe("Industry-specific improvement suggestions"),
  }),
  overallHealth: z.object({
    score: z.number().min(0).max(100).describe("Overall resume health score"),
    grade: z.string().describe("Letter grade (A+, A, B+, B, C+, C, D, F)"),
    improvements: z
      .array(z.string())
      .describe("Priority improvement recommendations"),
  }),
});

// Type inference from Zod schema
type AnalyticsData = z.infer<typeof analyticsSchema>;

// Simple in-memory cache for analytics results
const analyticsCache = new Map<
  string,
  { data: AnalyticsData; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check cache first
    const cacheKey = `analytics_${userId}`;
    const cached = analyticsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("[ANALYTICS] Returning cached result for user:", userId);
      return NextResponse.json(cached.data);
    }

    // Get the user's most recent resume
    const resume = await db.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!resume) {
      return NextResponse.json(
        {
          error: "No resume found. Please upload a resume first.",
        },
        { status: 404 }
      );
    }

    // Get user profile for industry context
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { profession: true, experience: true, skills: true },
    });

    const profession = user?.profession || "General";
    const experience = user?.experience || "Entry Level";
    const userSkills = user?.skills || [];

    // AI Analysis using Gemini
    const model = getModel();
    const parser = StructuredOutputParser.fromZodSchema(analyticsSchema);

    const analyticsTemplate = `Analyze this resume and provide structured analytics:

RESUME: {resumeContent}
PROFILE: {profession} | {experience} | Skills: {userSkills}

2025 JOB MARKET CONTEXT:
- High demand: AI/ML, Cloud, Cybersecurity, Data Science
- ATS priorities: Clear format, keywords, quantified results

ANALYSIS REQUIRED:
1. ATS Score (0-100): Format compatibility + keyword optimization
2. Skills Analysis: Total skills found, high-demand matches, missing trends
3. Industry Benchmark: Percentile vs peers, ranking assessment
4. Overall Health: Letter grade + priority improvements

Be concise and data-driven. Focus on actionable insights.

{format_instructions}`;

    const prompt = PromptTemplate.fromTemplate(analyticsTemplate, {
      partialVariables: { format_instructions: parser.getFormatInstructions() },
    });

    const chain = prompt.pipe(model).pipe(parser);

    const analytics = await chain.invoke({
      resumeContent: resume.content,
      profession,
      experience,
      userSkills: userSkills.join(", "),
      format_instructions: parser.getFormatInstructions(),
    });

    // Cache the result
    analyticsCache.set(cacheKey, {
      data: analytics,
      timestamp: Date.now(),
    });

    console.log("[ANALYTICS] Generated new result for user:", userId);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[ANALYTICS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to generate analytics. Please try again." },
      { status: 500 }
    );
  }
}
