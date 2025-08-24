// src/app/upload-resume/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UploadCloud, File as FileIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { getApiUrl } from '@/lib/utils';

export default function UploadResumePage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [existingResume, setExistingResume] = useState<{ id: string; title: string } | null>(null);
    const [isCheckingExisting, setIsCheckingExisting] = useState(true);
    const router = useRouter();
    const session = useSession();

    useEffect(() => {
        if (!session?.data?.user) {
            router.push('/signin');
        }
    }, [router, session]);

    useEffect(() => {
        // Check if user already has a resume
        const checkExistingResume = async () => {
            try {
                const response = await fetch(getApiUrl('/api/resume'));
                if (response.ok) {
                    const data = await response.json();
                    if (data.resumes && data.resumes.length > 0) {
                        setExistingResume(data.resumes[0]); // Take the first resume
                    }
                }
            } catch (error) {
                console.error('Error checking existing resume:', error);
            } finally {
                setIsCheckingExisting(false);
            }
        };

        if (session?.data?.user) {
            checkExistingResume();
        }
    }, [session?.data?.user]);
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                toast.error('Invalid File Type Please upload a PDF file.');
                return;
            }
            setFile(selectedFile);
        }
    };
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!file) {
            toast.error('No File Selected. Please select a resume to upload.');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(getApiUrl('/api/resume'), {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Special handling for existing resume error
                if (response.status === 409 && errorData.existingResume) {
                    toast.error(
                        `You already have a resume uploaded: "${errorData.existingResume.title}". Please delete it from your profile page before uploading a new one.`,
                        {
                            duration: 6000,
                            action: {
                                label: 'Go to Profile',
                                onClick: () => router.push('/profile'),
                            },
                        }
                    );
                } else {
                    toast.error(errorData.error || 'Upload failed');
                }
                return;
            }

            const data = await response.json();
            toast.success(`${file.name} has been processed. Redirecting to analysis...`);

            // router.refresh() tells Next.js to refetch server data on the next page
            router.refresh();
            // Redirect DIRECTLY to the analysis page for the new resume
            router.push(`/dashboard/analyze/${data.resumeId}`);

        } catch (error) {
            toast.error(error as string);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Upload Your Resume</CardTitle>
                    <CardDescription>
                        Upload your resume as a PDF file to get started with your analysis.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isCheckingExisting ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Checking existing resumes...</span>
                        </div>
                    ) : existingResume ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h3 className="font-semibold text-yellow-800 mb-2">You already have a resume uploaded</h3>
                                <p className="text-yellow-700 mb-4">
                                    Resume: <strong>{existingResume.title}</strong>
                                </p>
                                <p className="text-sm text-yellow-600 mb-4">
                                    You can only have one resume at a time. To upload a new resume, please delete your current one from your profile page.
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => router.push('/profile')}
                                        variant="outline"
                                    >
                                        Manage Resume
                                    </Button>
                                    <Button
                                        onClick={() => router.push(`/dashboard/analyze/${existingResume.id}`)}
                                    >
                                        View Analysis
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label
                                    htmlFor="resume-upload"
                                    className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-muted-foreground">PDF only (MAX. 5MB)</p>
                                    </div>
                                    <input
                                        id="resume-upload"
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept=".pdf"
                                        disabled={isUploading}
                                    />
                                </label>
                            </div>

                            {file && !isUploading && (
                                <div className="w-full p-3 border rounded-md flex items-center justify-between bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <FileIcon className="h-5 w-5 text-primary" />
                                        <span className="text-sm font-medium">{file.name}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={!file || isUploading}>
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload and Process'
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}