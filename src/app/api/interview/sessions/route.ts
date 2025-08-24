import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db.interviewSession.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse JSON strings for questions and answers
    const formattedSessions = sessions.map((session) => ({
      ...session,
      questions: session.questions ? JSON.parse(session.questions) : [],
      answers: session.answers ? JSON.parse(session.answers) : [],
    }));

    return NextResponse.json({
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error("Error fetching interview sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, answers, status, score, feedback } =
      await request.json();

    const updatedSession = await db.interviewSession.update({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
      data: {
        answers: answers ? JSON.stringify(answers) : undefined,
        status: status || undefined,
        score: score || undefined,
        feedback: feedback || undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      session: {
        ...updatedSession,
        questions: updatedSession.questions
          ? JSON.parse(updatedSession.questions)
          : [],
        answers: updatedSession.answers
          ? JSON.parse(updatedSession.answers)
          : [],
      },
    });
  } catch (error) {
    console.error("Error updating interview session:", error);
    return NextResponse.json(
      { error: "Failed to update interview session" },
      { status: 500 }
    );
  }
}
