import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getModel } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      role,
      company,
      resumeId,
      difficulty = "medium",
      count = 10,
    } = await request.json();

    if (!role || !company) {
      return NextResponse.json(
        { error: "Role and company are required" },
        { status: 400 }
      );
    }

    // Get user's resume content if resumeId provided
    let resumeContent = "";
    if (resumeId) {
      const resume = await db.resume.findFirst({
        where: {
          id: parseInt(resumeId),
          userId: session.user.id,
        },
        select: { content: true },
      });
      resumeContent = resume?.content || "";
    }

    // Generate interview questions using Gemini
    const model = getModel();
    const prompt = `
You are an expert interview coach. Generate ${count} realistic interview questions for the following position:

Role: ${role}
Company: ${company}
Difficulty Level: ${difficulty}

${resumeContent ? `Candidate's Resume Content:\n${resumeContent}\n` : ""}

Generate a mix of questions covering:
1. Behavioral questions (STAR method applicable)
2. Technical questions (role-specific)
3. Situational questions
4. Company culture fit questions
5. Role-specific challenges

For each question, provide:
- The question text
- Category (behavioral, technical, situational, company-specific)
- Difficulty level (easy, medium, hard)
- 2-3 brief tips for answering

Format your response as a JSON array where each question is an object with:
{
    "question": "Question text here",
    "category": "behavioral|technical|situational|company-specific",
    "difficulty": "easy|medium|hard",
    "tips": ["tip1", "tip2", "tip3"]
}

Make the questions specific to the role and company type. If resume content is provided, include some questions that relate to the candidate's experience.
        `;

    const result = await model.invoke(prompt);

    let questions;
    try {
      // LangChain returns content in result.content
      const responseText =
        typeof result.content === "string"
          ? result.content
          : JSON.stringify(result.content);

      // Try to parse the JSON response
      questions = JSON.parse(responseText);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the response
      const responseText =
        typeof result.content === "string"
          ? result.content
          : JSON.stringify(result.content);

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse questions from AI response");
      }
    }

    // Validate and clean the questions
    const validatedQuestions = questions.map((q: any, index: number) => ({
      id: `q_${Date.now()}_${index}`,
      question: q.question || "Question not available",
      category: q.category || "general",
      difficulty: q.difficulty || "medium",
      tips: Array.isArray(q.tips) ? q.tips : [],
    }));

    // Create a new interview session in the database
    const interviewSession = await db.interviewSession.create({
      data: {
        userId: session.user.id,
        role,
        company,
        questions: JSON.stringify(validatedQuestions),
        status: "active",
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      sessionId: interviewSession.id,
      questions: validatedQuestions,
      role,
      company,
    });
  } catch (error) {
    console.error("Error generating interview questions:", error);
    return NextResponse.json(
      { error: "Failed to generate interview questions" },
      { status: 500 }
    );
  }
}
