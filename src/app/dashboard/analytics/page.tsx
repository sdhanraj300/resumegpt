// src/app/dashboard/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BarChart,
    TrendingUp,
    TrendingDown,
    Target,
    Award,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Lightbulb
} from "lucide-react";
import { Loader } from "@/components/ui/loader";

interface AnalyticsData {
    atsScore: number;
    skillsAnalysis: {
        totalSkills: number;
        demandedSkills: number;
        missingSkills: string[];
        strongSkills: string[];
    };
    industryBenchmark: {
        score: number;
        ranking: string;
        improvements: string[];
    };
    overallHealth: {
        score: number;
        grade: string;
        improvements: string[];
    };
}

export default function AnalyticsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        // Only run if we have a user ID and haven't fetched yet
        if (status === 'loading') return; // Wait for session to load

        if (!session?.user?.id) {
            router.push('/signin');
            return;
        }

        if (hasFetched) return; // Prevent multiple calls

        const fetchAnalytics = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/analytics/comprehensive', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch analytics');
                }

                const data = await response.json();
                setAnalytics(data);
                setHasFetched(true); // Mark as fetched
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [session?.user?.id, status, router, hasFetched]);

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <Loader />
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold">Analyzing Your Resume</h3>
                        <p className="text-muted-foreground">
                            Our AI is evaluating ATS compatibility, skills analysis, and industry benchmarks...
                        </p>
                        <div className="text-sm text-muted-foreground">
                            This usually takes 10-15 seconds
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Unable to Load Analytics</h2>
                    <p className="text-muted-foreground mb-4">{error || 'Please try again later'}</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600 dark:text-green-400";
        if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
        return "text-red-600 dark:text-red-400";
    };

    const getScoreIcon = (score: number) => {
        if (score >= 80) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
        if (score >= 60) return <Target className="h-5 w-5 text-yellow-600" />;
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">Resume Analytics</h1>
                    <p className="text-lg text-muted-foreground">
                        Comprehensive analysis of your resume performance and optimization opportunities
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => {
                        setHasFetched(false);
                        setAnalytics(null);
                        setIsLoading(true);
                        setError(null);
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? "Analyzing..." : "Refresh Analysis"}
                </Button>
            </div>

            {/* Overall Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
                        {getScoreIcon(analytics.overallHealth.score)}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overallHealth.score}%</div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Badge variant={analytics.overallHealth.score >= 80 ? "default" : "secondary"}>
                                Grade {analytics.overallHealth.grade}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ATS Compatibility</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(analytics.atsScore)}`}>
                            {analytics.atsScore}%
                        </div>
                        <Progress value={analytics.atsScore} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Skills Coverage</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analytics.skillsAnalysis.demandedSkills}/{analytics.skillsAnalysis.totalSkills}
                        </div>
                        <p className="text-xs text-muted-foreground">Skills in demand</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Industry Ranking</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.industryBenchmark.ranking}</div>
                        <div className={`text-xs ${getScoreColor(analytics.industryBenchmark.score)}`}>
                            {analytics.industryBenchmark.score}% percentile
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Analysis Tabs */}
            <Tabs defaultValue="skills" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
                    <TabsTrigger value="ats">ATS Optimization</TabsTrigger>
                    <TabsTrigger value="improvements">Recommendations</TabsTrigger>
                </TabsList>

                <TabsContent value="skills" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    Strong Skills
                                </CardTitle>
                                <CardDescription>Skills that strengthen your profile</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {analytics.skillsAnalysis.strongSkills.map((skill, index) => (
                                        <Badge key={index} variant="default" className="mr-2">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                    Missing Skills
                                </CardTitle>
                                <CardDescription>In-demand skills to consider adding</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {analytics.skillsAnalysis.missingSkills.map((skill, index) => (
                                        <Badge key={index} variant="outline" className="mr-2">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="ats" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>ATS Compatibility Report</CardTitle>
                            <CardDescription>
                                How well your resume performs with Applicant Tracking Systems
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span>Format Compatibility</span>
                                    <Badge variant={analytics.atsScore >= 90 ? "default" : "secondary"}>
                                        {analytics.atsScore >= 90 ? "Excellent" : "Needs Improvement"}
                                    </Badge>
                                </div>
                                <Progress value={analytics.atsScore} />
                                <p className="text-sm text-muted-foreground">
                                    Your resume has a {analytics.atsScore}% chance of passing initial ATS screening.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="improvements" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-yellow-600" />
                                Priority Improvements
                            </CardTitle>
                            <CardDescription>Actionable steps to enhance your resume</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.overallHealth.improvements.map((improvement, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                        <p className="text-sm">{improvement}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
