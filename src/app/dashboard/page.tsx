// src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Briefcase, FileScan } from 'lucide-react';

export default async function Dashboard() {
  // Protect the route and get the session
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/signin');
  }

  // Get the user's latest resume via API
  const headersList = await headers();
  const response = await fetch(`/api/resume`, {
    method: 'GET',
    headers: {
      'Cookie': headersList.get('cookie') || '',
    },
    cache: 'no-store',
    next: { revalidate: 0 }, // Ensure fresh data on every request
  });

  if (!response.ok) {
    console.error('Failed to fetch resume:', response.statusText);
    redirect('/upload');
  }

  const { resumeId } = await response.json();

  // If no resume exists, redirect to upload page
  if (!resumeId) {
    redirect('/upload');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, {session.user.name?.split(' ')[0] ?? 'User'}!
        </h1>
        <p className="text-lg text-muted-foreground">
          What would you like to do today?
        </p>
      </div>

      {/* Two-column grid for the tool sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Analyze Resume Section */}
        <Link href={`/dashboard/analyze/${resumeId}`} className="group block">
          <Card className="h-full hover:border-primary transition-colors hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <FileScan className="h-10 w-10 text-primary mb-4" />
                <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-2xl">Analyze Resume</CardTitle>
              <CardDescription>
                Compare your resume against a job description to get a match score and actionable feedback.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Job Matcher Section */}
        <Link href={`/dashboard/jobmatch`} className="group block">
          <Card className="hover:border-primary transition-colors hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Briefcase className="h-10 w-10 text-muted-foreground mb-4" />
                <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-2xl">Job Matcher</CardTitle>
              <CardDescription>
                Discover job opportunities that perfectly match your skills and experience profile.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

      </div>
    </div>
  );
}