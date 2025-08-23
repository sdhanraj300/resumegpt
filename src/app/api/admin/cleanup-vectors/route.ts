// src/app/api/admin/cleanup-vectors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  cleanupOrphanedVectors,
  getUserVectorCount,
} from "@/lib/pinecone-cleanup";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    const userId = session.user.id;

    switch (action) {
      case "cleanup":
        await cleanupOrphanedVectors(userId);
        return NextResponse.json({
          message: "Cleanup completed successfully",
          userId,
        });

      case "count":
        const count = await getUserVectorCount(userId);
        return NextResponse.json({
          vectorCount: count,
          userId,
        });

      default:
        return NextResponse.json(
          {
            error: "Invalid action. Use 'cleanup' or 'count'",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in vector cleanup:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
