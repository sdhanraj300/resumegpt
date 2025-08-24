// src/app/dashboard/interview-prep/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    BrainCircuit,
    MessageSquare,
    Target,
    Play,
    Star,
    Clock,
    CheckCircle2,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";

interface Question {
    id: string;
    question: string;
    category: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    tips?: string[];
}

interface MockSession {
    id: string;
    questions: Question[];
    answers: { questionId: string; answer: string; score?: number; feedback?: string }[];
    duration: number;
    overallScore?: number;
    createdAt: string;
}

export default function InterviewPrepPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [userResume, setUserResume] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
    const [mockSessions, setMockSessions] = useState<MockSession[]>([]);

    // Form states
    const [jobTitle, setJobTitle] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [jobDescription, setJobDescription] = useState("");

    // Mock interview states
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [sessionInProgress, setSessionInProgress] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session?.user?.id) {
            router.push('/signin');
            return;
        }
        fetchUserResume();
        fetchMockSessions();
    }, [session?.user?.id, status, router]);

    const fetchUserResume = async () => {
        try {
            const response = await fetch('/api/resume');
            if (response.ok) {
                const data = await response.json();
                if (data.resumes && data.resumes.length > 0) {
                    setUserResume(data.resumes[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching resume:', error);
        }
    };

    const fetchMockSessions = async () => {
        try {
            const response = await fetch('/api/interview/sessions');
            if (response.ok) {
                const data = await response.json();
                setMockSessions(data.sessions || []);
            }
        } catch (error) {
            console.error('Error fetching mock sessions:', error);
        }
    };

    const generateQuestions = async () => {
        if (!jobTitle.trim()) {
            toast.error('Please enter a job title');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/interview/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: jobTitle,
                    company: companyName || 'General Company',
                    resumeId: userResume?.id,
                    difficulty: 'medium',
                    count: 10
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate questions');
            }

            const data = await response.json();
            setCurrentQuestions(data.questions);
            toast.success(`Generated ${data.questions.length} interview questions!`);
        } catch (error) {
            toast.error('Failed to generate questions. Please try again.');
            console.error('Error generating questions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const startMockInterview = () => {
        if (currentQuestions.length === 0) {
            toast.error('Please generate questions first');
            return;
        }
        setSessionInProgress(true);
        setCurrentQuestionIndex(0);
        setCurrentAnswer("");
    };

    const submitAnswer = async () => {
        if (!currentAnswer.trim()) {
            toast.error('Please provide an answer');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/interview/evaluate-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: currentQuestions[currentQuestionIndex].question,
                    answer: currentAnswer,
                    jobTitle,
                    category: currentQuestions[currentQuestionIndex].category
                })
            });

            if (!response.ok) {
                throw new Error('Failed to evaluate answer');
            }

            const evaluation = await response.json();

            // Move to next question or finish session
            if (currentQuestionIndex < currentQuestions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setCurrentAnswer("");
                toast.success(`Answer evaluated! Score: ${evaluation.score}/10`);
            } else {
                // Finish the session
                setSessionInProgress(false);
                toast.success('Mock interview completed!');
                fetchMockSessions(); // Refresh sessions
            }
        } catch (error) {
            toast.error('Failed to evaluate answer. Please try again.');
            console.error('Error evaluating answer:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!userResume) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <BrainCircuit className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">No Resume Found</h2>
                    <p className="text-muted-foreground mb-4">
                        You need to upload a resume first to use the interview preparation tools.
                    </p>
                    <Button onClick={() => router.push('/upload')}>
                        Upload Resume
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Interview Preparation</h1>
                <p className="text-lg text-muted-foreground">
                    AI-powered interview practice tailored to your resume and target role
                </p>
            </div>

            <Tabs defaultValue="question-generator" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="question-generator">Question Generator</TabsTrigger>
                    <TabsTrigger value="mock-interview">Mock Interview</TabsTrigger>
                    <TabsTrigger value="session-history">Session History</TabsTrigger>
                </TabsList>

                {/* Question Generator Tab */}
                <TabsContent value="question-generator" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Generate Custom Questions
                            </CardTitle>
                            <CardDescription>
                                Create personalized interview questions based on your target role and resume
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="jobTitle">Job Title *</Label>
                                    <Input
                                        id="jobTitle"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        placeholder="e.g., Senior Software Engineer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Company Name (Optional)</Label>
                                    <Input
                                        id="companyName"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="e.g., Google, Microsoft"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="jobDescription">Job Description (Optional)</Label>
                                <Textarea
                                    id="jobDescription"
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste the job description here for more targeted questions..."
                                    rows={4}
                                />
                            </div>
                            <Button
                                onClick={generateQuestions}
                                disabled={isLoading || !jobTitle.trim()}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="mr-2 h-4 w-4" />
                                        Generating Questions...
                                    </>
                                ) : (
                                    <>
                                        <BrainCircuit className="mr-2 h-4 w-4" />
                                        Generate Questions
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Generated Questions Display */}
                    {currentQuestions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Generated Questions ({currentQuestions.length})</CardTitle>
                                <CardDescription>
                                    Review your personalized interview questions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {currentQuestions.map((question, index) => (
                                    <div key={question.id} className="border rounded-lg p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Question {index + 1}</span>
                                            <div className="flex gap-2">
                                                <Badge variant="outline">{question.category}</Badge>
                                                <Badge
                                                    variant={
                                                        question.difficulty === 'Easy' ? 'default' :
                                                            question.difficulty === 'Medium' ? 'secondary' : 'destructive'
                                                    }
                                                >
                                                    {question.difficulty}
                                                </Badge>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{question.question}</p>
                                        {question.tips && (
                                            <div className="mt-2">
                                                <p className="text-xs font-medium text-blue-600 mb-1">💡 Tips:</p>
                                                <ul className="text-xs text-muted-foreground space-y-1">
                                                    {question.tips.map((tip, tipIndex) => (
                                                        <li key={tipIndex}>• {tip}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    onClick={startMockInterview}
                                    className="w-full"
                                    size="lg"
                                >
                                    <Play className="mr-2 h-4 w-4" />
                                    Start Mock Interview
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Mock Interview Tab */}
                <TabsContent value="mock-interview" className="space-y-6">
                    {!sessionInProgress ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    Mock Interview Practice
                                </CardTitle>
                                <CardDescription>
                                    Practice answering questions with AI feedback
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {currentQuestions.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">
                                            Generate questions first to start a mock interview
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <p>Ready to start your mock interview with {currentQuestions.length} questions?</p>
                                        <Button onClick={startMockInterview} size="lg">
                                            <Play className="mr-2 h-4 w-4" />
                                            Start Interview
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Question {currentQuestionIndex + 1} of {currentQuestions.length}</CardTitle>
                                        <CardDescription>
                                            {currentQuestions[currentQuestionIndex].category} • {currentQuestions[currentQuestionIndex].difficulty}
                                        </CardDescription>
                                    </div>
                                    <Progress
                                        value={((currentQuestionIndex + 1) / currentQuestions.length) * 100}
                                        className="w-24"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-lg">{currentQuestions[currentQuestionIndex].question}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="answer">Your Answer</Label>
                                    <Textarea
                                        id="answer"
                                        value={currentAnswer}
                                        onChange={(e) => setCurrentAnswer(e.target.value)}
                                        placeholder="Type your answer here..."
                                        rows={6}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={submitAnswer}
                                        disabled={isLoading || !currentAnswer.trim()}
                                        className="flex-1"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader className="mr-2 h-4 w-4" />
                                                Evaluating...
                                            </>
                                        ) : (
                                            currentQuestionIndex === currentQuestions.length - 1 ?
                                                'Finish Interview' : 'Next Question'
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSessionInProgress(false)}
                                    >
                                        End Session
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Session History Tab */}
                <TabsContent value="session-history" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Interview Session History
                            </CardTitle>
                            <CardDescription>
                                Review your past mock interview performances
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {mockSessions.length === 0 ? (
                                <div className="text-center py-8">
                                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">
                                        No interview sessions yet. Complete a mock interview to see your history.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {mockSessions.map((session) => (
                                        <div key={session.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    <span className="font-medium">
                                                        Session {new Date(session.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {session.overallScore && (
                                                    <div className="flex items-center gap-2">
                                                        <Star className="h-4 w-4 text-yellow-500" />
                                                        <span className="font-medium">{session.overallScore}/10</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {session.questions.length} questions • {Math.round(session.duration / 60)} minutes
                                            </div>
                                            <Button variant="outline" size="sm" className="mt-2">
                                                <ArrowRight className="h-4 w-4 mr-2" />
                                                View Details
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
