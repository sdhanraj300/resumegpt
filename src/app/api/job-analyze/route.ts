import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractKeyRequirements } from "@/lib/analyzeJob";
import { analyzeJobAndResume } from "@/lib/analyzeJobAndResume";

export async function POST(req: NextRequest) {

    const user = await getServerSession(authOptions);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.user.id;

    try {
        const body = await req.json();
        const { jobId } = body;

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        // Convert jobId to a number
        const jobIdNum = parseInt(jobId, 10);
        if (isNaN(jobIdNum)) {
            return NextResponse.json({ error: 'Invalid Job ID format' }, { status: 400 });
        }

        const job = await db.job.findUnique({
            where: { id: jobIdNum },
        });

        const resume = await db.resume.findFirst({
            where: { userId: userId },
        });

        // console.log(resume);

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        const content = job?.content || '';
        // console.log(content);
        const requirements = await extractKeyRequirements(content);

        // console.log(requirements);

        const jobAndResume = await analyzeJobAndResume(requirements, userId, resume?.id || 0);

        // console.log(jobAndResume);

        return NextResponse.json({ jobAndResume }, { status: 200 });
    } catch (error) {
        console.error('Error analyzing job:', error);
        return NextResponse.json({ error: 'Failed to analyze job' }, { status: 500 });
    }
}
