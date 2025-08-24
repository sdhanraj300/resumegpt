"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
    Clock,
    Star,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Lightbulb,
    Target,
    TrendingUp,
    RotateCcw
} from "lucide-react";
import { Loader } from "@/components/ui/loader";

interface Question {
    id: string;
    question: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tips?: string[];
}

interface Answer {
    questionId: string;
    answer: string;
    score?: number;
    feedback?: string;
    strengths?: string[];
    improvements?: string[];
    followUpQuestions?: string[];
}

interface InterviewPracticeProps {
    sessionId: string;
    questions: Question[];
    role: string;
    company: string;
    onSessionComplete: (sessionId: string, answers: Answer[]) => void;
}

export function InterviewPractice({
    sessionId,
    questions,
    role,
    company,
    onSessionComplete
}: InterviewPracticeProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [sessionCompleted, setSessionCompleted] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswerData = answers.find(a => a.questionId === currentQuestion?.id);
    const completedQuestions = answers.length;
    const progressPercentage = (completedQuestions / questions.length) * 100;

    // Timer functionality
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer(timer => timer + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startTimer = () => {
        if (!isTimerRunning) {
            setIsTimerRunning(true);
        }
    };

    const submitAnswer = async () => {
        if (!currentAnswer.trim()) {
            alert('Please provide an answer before submitting.');
            return;
        }

        setIsEvaluating(true);
        try {
            const response = await fetch('/api/interview/evaluate-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: currentQuestion.question,
                    answer: currentAnswer,
                    role,
                    company,
                    category: currentQuestion.category
                })
            });

            if (response.ok) {
                const evaluation = await response.json();
                const newAnswer: Answer = {
                    questionId: currentQuestion.id,
                    answer: currentAnswer,
                    score: evaluation.score,
                    feedback: evaluation.feedback,
                    strengths: evaluation.strengths,
                    improvements: evaluation.improvements,
                    followUpQuestions: evaluation.followUpQuestions
                };

                const updatedAnswers = [...answers, newAnswer];
                setAnswers(updatedAnswers);
                setCurrentAnswer("");

                // Move to next question or complete session
                if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                } else {
                    setSessionCompleted(true);
                    setIsTimerRunning(false);
                    onSessionComplete(sessionId, updatedAnswers);
                }
            }
        } catch (error) {
            console.error('Error evaluating answer:', error);
            alert('Failed to evaluate answer. Please try again.');
        } finally {
            setIsEvaluating(false);
        }
    };

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            // Load previous answer if exists
            const prevAnswer = answers.find(a => a.questionId === questions[currentQuestionIndex - 1].id);
            setCurrentAnswer(prevAnswer?.answer || "");
        }
    };

    const goToNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            // Load next answer if exists
            const nextAnswer = answers.find(a => a.questionId === questions[currentQuestionIndex + 1].id);
            setCurrentAnswer(nextAnswer?.answer || "");
        }
    };

    const restartSession = () => {
        setCurrentQuestionIndex(0);
        setCurrentAnswer("");
        setAnswers([]);
        setSessionCompleted(false);
        setTimer(0);
        setIsTimerRunning(false);
    };

    if (sessionCompleted) {
        const averageScore = answers.reduce((sum, a) => sum + (a.score || 0), 0) / answers.length;

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl">Interview Session Completed!</CardTitle>
                        <CardDescription>
                            Great job! Here&apos;s your performance summary for {role} at {company}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <div className="text-2xl font-bold text-primary">{answers.length}</div>
                                <div className="text-sm text-muted-foreground">Questions Answered</div>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{Math.round(averageScore)}</div>
                                <div className="text-sm text-muted-foreground">Average Score</div>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{formatTime(timer)}</div>
                                <div className="text-sm text-muted-foreground">Total Time</div>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <Button onClick={restartSession} variant="outline">
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Practice Again
                            </Button>
                            <Button onClick={() => onSessionComplete(sessionId, answers)}>
                                View Detailed Feedback
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Summary of All Answers */}
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {answers.map((answer, index) => (
                                <div key={answer.questionId} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">Question {index + 1}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {questions.find(q => q.id === answer.questionId)?.category}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={answer.score && answer.score >= 80 ? "default" : "secondary"}>
                                            {answer.score}/100
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                    No questions available. Please generate questions first.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Progress Header */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Interview Practice</div>
                            <div className="text-lg font-semibold">{role} at {company}</div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(timer)}
                            </div>
                            <Button size="sm" onClick={startTimer} disabled={isTimerRunning}>
                                {isTimerRunning ? 'Timer Running' : 'Start Timer'}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Progress: {completedQuestions} of {questions.length}</span>
                            <span>{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            {/* Current Question */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{currentQuestion.category}</Badge>
                                <Badge variant={
                                    currentQuestion.difficulty === 'easy' ? 'default' :
                                        currentQuestion.difficulty === 'medium' ? 'secondary' : 'destructive'
                                }>
                                    {currentQuestion.difficulty}
                                </Badge>
                            </div>
                            <CardTitle className="text-lg">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </CardTitle>
                        </div>
                        {currentAnswerData && (
                            <div className="text-center">
                                <div className="text-sm text-muted-foreground">Score</div>
                                <div className="text-2xl font-bold text-primary">{currentAnswerData.score}</div>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-lg leading-relaxed">{currentQuestion.question}</p>
                    </div>

                    {currentQuestion.tips && currentQuestion.tips.length > 0 && (
                        <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Tips:</strong>
                                <ul className="mt-2 space-y-1">
                                    {currentQuestion.tips.map((tip, index) => (
                                        <li key={index} className="text-sm">• {tip}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-3">
                        <label className="text-sm font-medium">Your Answer</label>
                        <Textarea
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder="Type your answer here... Use the STAR method (Situation, Task, Action, Result) for behavioral questions."
                            rows={8}
                            disabled={isEvaluating || Boolean(currentAnswerData)}
                        />
                        <div className="text-xs text-muted-foreground">
                            Aim for 2-3 minutes speaking time (roughly 300-500 words)
                        </div>
                    </div>

                    {currentAnswerData && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-600" />
                                    AI Feedback
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                                    <ul className="space-y-1">
                                        {currentAnswerData.strengths?.map((strength, index) => (
                                            <li key={index} className="text-sm flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                {strength}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {currentAnswerData.improvements && currentAnswerData.improvements.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-orange-600 mb-2">Areas for Improvement</h4>
                                        <ul className="space-y-1">
                                            {currentAnswerData.improvements.map((improvement, index) => (
                                                <li key={index} className="text-sm flex items-start gap-2">
                                                    <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                                    {improvement}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">{currentAnswerData.feedback}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={goToPreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                </Button>

                <div className="flex gap-2">
                    {!currentAnswerData ? (
                        <Button
                            onClick={submitAnswer}
                            disabled={!currentAnswer.trim() || isEvaluating}
                        >
                            {isEvaluating ? (
                                <>
                                    <Loader className="mr-2 h-4 w-4" />
                                    Evaluating...
                                </>
                            ) : (
                                'Submit Answer'
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={goToNextQuestion}
                            disabled={currentQuestionIndex === questions.length - 1}
                        >
                            Next Question
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>

                <Button
                    variant="outline"
                    onClick={goToNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                >
                    Skip
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
