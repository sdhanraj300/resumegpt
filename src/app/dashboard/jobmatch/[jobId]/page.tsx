// src/app/dashboard/analyze/[jobId]/page.tsx (or your results page path)
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, AlertTriangle, CheckCircle2, Lightbulb, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

// Define a type for our analysis data for better type safety
interface AnalysisReport {
    overallScore: number;
    strengths: string[];
    gaps: string[];
    suggestions: string;
}


// A small component for the score circle
const ScoreCircle = ({ score }: { score: number }) => {
    const circumference = 2 * Math.PI * 45; // 2 * pi * radius
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const scoreColor = score > 70 ? 'text-green-500' : score > 40 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="relative h-40 w-40">
            <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" strokeWidth="10" className="stroke-muted" fill="transparent" />
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    strokeWidth="10"
                    className={`stroke-current ${scoreColor} transition-all duration-1000 ease-in-out`}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center text-4xl font-bold ${scoreColor}`}>
                {score}<span className="text-2xl">%</span>
            </div>
        </div>
    );
};


export default function JobMatchPage() {
    const router = useRouter();
    const { status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push('/signin');
        },
    });
    const { jobId } = useParams();
    // Updated state to match our expected data structure
    const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'authenticated' && jobId) {
            const fetchJobData = async () => {
                try {
                    // NOTE: Your API should be updated to accept BOTH resumeId and jobId
                    // For now, assuming it takes jobId and finds the latest resume
                    const response = await fetch('/api/job-analyze', { // Assuming this is your analysis endpoint
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jobId: parseInt(jobId as string),
                            // You should also pass the resumeId the user wants to analyze
                            // resumeId: someResumeId 
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to fetch analysis data');
                    }

                    const data = await response.json();
                    console.log(data.jobAndResume);
                    // For now, let's assume the API returns the structure we need
                    // You might need to adjust your API to return jobTitle as well
                    setAnalysis(data.jobAndResume);

                } catch (err: any) {
                    console.error('Error fetching job data:', err);
                    setError(err.message || 'Failed to load job data');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchJobData();
        }
    }, [status, jobId, router]);

    // --- Loading and Error States (Enhanced UI) ---
    if (status === 'loading' || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating your analysis...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-8 max-w-2xl">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!analysis) {
        return null; // Or some "not found" state
    }

    // --- The Main Results UI ---
    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Analysis Report</h1>
                <p className="text-lg text-muted-foreground">Resume Match Report</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 flex justify-center">
                    <Card className="flex flex-col items-center justify-center p-6 w-full max-w-xs">
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl">Overall Match Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScoreCircle score={analysis.overallScore} />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                                Strengths
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 list-disc list-inside text-muted-foreground">
                                {analysis.strengths.map((strength, i) => <li key={i}>{strength}</li>)}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <XCircle className="h-6 w-6 text-red-500" />
                                Key Gaps
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 list-disc list-inside text-muted-foreground">
                                {analysis.gaps.map((gap, i) => <li key={i}>{gap}</li>)}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Separator className="my-8" />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-6 w-6 text-yellow-500" />
                        Actionable Suggestions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                        {analysis.suggestions}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}