// src/app/page.tsx
'use client';

import { BotMessageSquare, ScanSearch, FileText, ArrowRight } from 'lucide-react';
import React from 'react';
import { useRouter } from 'next/navigation'; // Import the router hook
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter(); // Initialize the router

  // All state and handlers for file upload have been removed.

  const handleGetStarted = () => {
    router.push('/signup'); // Navigate to your signup page
  };

  return (
    <div className="bg-background min-h-screen text-foreground">
      <header className="absolute top-0 left-0 w-full z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BotMessageSquare className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">ResumeGPT</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open('https://github.com/your-repo', '_blank')}
            className="hidden sm:inline-flex"
          >
            View on GitHub
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-32 pb-16 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center justify-center px-4 py-1 text-sm font-semibold tracking-wider text-primary bg-primary/10 rounded-full mb-4">
            Powered by Gemini
          </span>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 leading-tight">
            Land Your Dream Job with an AI-Powered Resume
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Stop guessing. Get instant, data-driven feedback on your resume against any job description. Optimize for ATS and impress recruiters.
          </p>

          <div className="flex justify-center">
            {/* The button is now simplified and calls the navigation handler */}
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="rounded-full shadow-lg transform hover:scale-105 transition-transform"
            >
              <ArrowRight className="w-5 h-5 mr-3" />
              Get Started
            </Button>
          </div>

          {/* Helper text updated to reflect the new action */}
          <p className="text-sm text-muted-foreground mt-4">Create an account to get started.</p>
        </div>
      </main>

      <section className="bg-secondary/50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold">How It Works</h3>
            <p className="text-muted-foreground mt-2">A simple, powerful process to get you hired faster.</p>
          </div>
          {/* This "How it Works" section remains relevant to the overall app flow */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 bg-card border rounded-lg shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">1. Upload Your Resume</h4>
              <p className="text-muted-foreground">
                Securely upload your current resume in PDF format after signing up. We'll link it to your account.
              </p>
            </div>
            <div className="text-center p-6 bg-card border rounded-lg shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mx-auto mb-4">
                <ScanSearch className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">2. Provide Job Details</h4>
              <p className="text-muted-foreground">
                Paste the text from the job description you're targeting. Our AI reads every detail and requirement.
              </p>
            </div>
            <div className="text-center p-6 bg-card border rounded-lg shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mx-auto mb-4">
                <BotMessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">3. Get AI Feedback</h4>
              <p className="text-muted-foreground">
                Receive a detailed analysis, match score, and actionable suggestions to tailor your resume perfectly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="container mx-auto px-6 py-6 text-center text-muted-foreground">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} ResumeGPT. Built by [Your Name].
          </p>
        </div>
      </footer>
    </div>
  );
}