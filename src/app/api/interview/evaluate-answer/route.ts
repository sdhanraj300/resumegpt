import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModel } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question, answer, role, company, category } = await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
    }

    // Evaluate the answer using Gemini
    const model = getModel();
    const prompt = `
You are an expert interview coach evaluating a candidate's answer. Please provide a detailed evaluation.

Position: ${role} at ${company}
Question Category: ${category}
Question: ${question}
Candidate's Answer: ${answer}

Please evaluate the answer based on:
1. Relevance to the question
2. Clarity and structure
3. Use of specific examples
4. Technical accuracy (if applicable)
5. Communication skills
6. Overall impression

Provide your response in the following JSON format:
{
    "score": 85,
    "feedback": "Detailed feedback explaining strengths and areas for improvement",
    "strengths": ["strength1", "strength2", "strength3"],
    "improvements": ["improvement1", "improvement2"],
    "followUpQuestions": ["follow-up question 1", "follow-up question 2"]
}

Score should be between 0-100.
        `;

    const result = await model.invoke(prompt);

    let evaluation;
    try {
      const responseText =
        typeof result.content === "string"
          ? result.content
          : JSON.stringify(result.content);

      evaluation = JSON.parse(responseText);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the response
      const responseText =
        typeof result.content === "string"
          ? result.content
          : JSON.stringify(result.content);

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback evaluation
        evaluation = {
          score: 75,
          feedback:
            "Answer received and processed. Please try again for detailed feedback.",
          strengths: ["Response provided"],
          improvements: ["Consider providing more specific examples"],
          followUpQuestions: ["Can you elaborate on your approach?"],
        };
      }
    }

    // Validate evaluation structure
    const validatedEvaluation = {
      score: evaluation.score || 75,
      feedback: evaluation.feedback || "Feedback processing completed.",
      strengths: Array.isArray(evaluation.strengths)
        ? evaluation.strengths
        : [],
      improvements: Array.isArray(evaluation.improvements)
        ? evaluation.improvements
        : [],
      followUpQuestions: Array.isArray(evaluation.followUpQuestions)
        ? evaluation.followUpQuestions
        : [],
    };

    return NextResponse.json(validatedEvaluation);
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
