import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteResumeVectors } from "@/lib/pinecone-cleanup";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const resumeId = parseInt(id);

    if (isNaN(resumeId)) {
      return NextResponse.json({ error: "Invalid resume ID" }, { status: 400 });
    }

    // Check if resume exists and belongs to the user
    const resume = await db.resume.findUnique({
      where: {
        id: resumeId,
        userId: session.user.id,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: "Resume not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete vectors from Pinecone first
    try {
      await deleteResumeVectors(session.user.id, resumeId);
      console.log(`Deleted vectors for resume ${resumeId} from Pinecone`);
    } catch (pineconeError) {
      console.error("Error deleting vectors from Pinecone:", pineconeError);
      // Continue with database deletion even if Pinecone fails
      // This prevents orphaned database records
    }

    // Delete the resume from database
    await db.resume.delete({
      where: {
        id: resumeId,
      },
    });

    console.log(
      `Successfully deleted resume ${resumeId} from database and Pinecone`
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting resume:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
