"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import JobDetailInput from '@/components/job-detail-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function JobMatch() {
    const router = useRouter();
    const session = useSession();
    useEffect(() => {
        if (!session?.data?.user) {
            router.push('/signin');
        }
    }, [router, session]);
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const handleAnalyze = async (input: string | FormData, type: 'text' | 'file') => {
        try {
            setIsAnalyzing(true)

            let response: Response

            if (type === 'text') {
                response = await fetch('/api/job', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: input }),
                })
            } else {
                response = await fetch('/api/job', {
                    method: 'POST',
                    body: input as FormData,
                })
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || `Request failed with status ${response.status}`)
            }

            const data = await response.json()
            router.push(`/dashboard/jobmatch/${data.jobId}`)
        } catch (error) {
            console.error('Error analyzing job:', error)
            alert(error instanceof Error ? error.message : 'Failed to analyze job. Please try again.')
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <Card className="border-0 shadow-none">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">Job Match Analyzer</CardTitle>
                    <CardDescription className="text-lg">
                        Paste your job description
                        or drop your resume to analyze how well your resume matches the position
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <JobDetailInput
                        onAnalyze={handleAnalyze}
                        isLoading={isAnalyzing}
                        className="mb-8"
                    />

                    {isAnalyzing && (
                        <div className="flex justify-center my-8">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <p>Analyzing job posting...</p>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}