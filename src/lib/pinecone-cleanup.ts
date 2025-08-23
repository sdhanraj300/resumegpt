// src/lib/pinecone-cleanup.ts
import { Pinecone } from "@pinecone-database/pinecone";
import { db } from "@/lib/db";

// Initialize Pinecone client
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API! });
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

/**
 * Clean up orphaned vectors in Pinecone for a specific user
 * This removes vectors that don't have corresponding resumes in the database
 */
export async function cleanupOrphanedVectors(userId: string) {
  try {
    // Get all resume IDs for this user from database
    const userResumes = await db.resume.findMany({
      where: { userId },
      select: { id: true },
    });

    const validResumeIds = new Set(userResumes.map((r) => r.id));

    if (validResumeIds.size === 0) {
      // If user has no resumes, delete all vectors in their namespace
      await pineconeIndex.namespace(userId).deleteAll();
      console.log(
        `Cleaned up all vectors for user ${userId} (no resumes found)`
      );
      return;
    }

    // Get all vectors in user's namespace using query approach
    // Since listPaginated doesn't include metadata, we use a different approach
    const queryResponse = await pineconeIndex.namespace(userId).query({
      vector: new Array(1536).fill(0), // Dummy vector for querying
      topK: 10000, // Large number to get all vectors
      includeMetadata: true,
      includeValues: false,
    });

    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      console.log(`No vectors found for user ${userId}`);
      return;
    }

    // Collect vector IDs that should be deleted (orphaned ones)
    const vectorsToDelete: string[] = [];

    for (const match of queryResponse.matches) {
      const vectorResumeId = match.metadata?.resumeId;
      if (vectorResumeId && !validResumeIds.has(Number(vectorResumeId))) {
        if (match.id) {
          vectorsToDelete.push(match.id);
        }
      }
    }

    // Delete orphaned vectors in batches
    if (vectorsToDelete.length > 0) {
      // Pinecone has a limit on batch deletes, so we process in chunks
      const batchSize = 1000;
      for (let i = 0; i < vectorsToDelete.length; i += batchSize) {
        const batch = vectorsToDelete.slice(i, i + batchSize);
        await pineconeIndex.namespace(userId).deleteMany(batch);
      }

      console.log(
        `Cleaned up ${vectorsToDelete.length} orphaned vectors for user ${userId}`
      );
    } else {
      console.log(`No orphaned vectors found for user ${userId}`);
    }
  } catch (error) {
    console.error(`Error cleaning up vectors for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Delete all vectors for a specific resume
 */
export async function deleteResumeVectors(userId: string, resumeId: number) {
  try {
    await pineconeIndex.namespace(userId).deleteMany({
      filter: { resumeId: { $eq: resumeId } },
    });
    console.log(
      `Deleted all vectors for resume ${resumeId} in user ${userId} namespace`
    );
  } catch (error) {
    console.error(`Error deleting vectors for resume ${resumeId}:`, error);
    throw error;
  }
}

/**
 * Get vector count for a user's namespace
 */
export async function getUserVectorCount(userId: string): Promise<number> {
  try {
    const stats = await pineconeIndex.namespace(userId).describeIndexStats();
    return stats.totalRecordCount || 0;
  } catch (error) {
    console.error(`Error getting vector count for user ${userId}:`, error);
    return 0;
  }
}
