import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ChatInterface } from '@/components/chat/chat-interface';

interface AnalyzePageProps {
  params: Promise<{ resumeId: string }>;
}

// This is the correct App Router way to fetch server-side data for a page
export default async function AnalyzePage({ params }: AnalyzePageProps) {
  // 1. Protect the route and get the session
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    redirect('/signin');
  }

  const { resumeId } = await params;
  // 2. Fetch the specific resume for this user
  const resume = await db.resume.findUnique({
    where: {
      id: parseInt(resumeId),
      userId: session.user.id, // Ensure user can only access their own resumes
    },
  });

  // If resume not found or doesn't belong to the user, redirect
  if (!resume) {
    redirect('/dashboard');
  }

  // 3. Render the page, passing the resume data to the client component
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-4">
        AI Analysis for: <span className="text-primary">{resume.title}</span>
      </h1>
      <ChatInterface
        resumeId={resume.id}
        userId={session.user.id}
        resumeTitle={resume.title}
      />
    </div>
  );
}