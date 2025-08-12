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

export default function UploadResumePage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();
    const session = useSession();
    useEffect(() => {
        if (!session?.data?.user) {
            router.push('/signin');
        }
    }, [router, session]);
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
            const response = await fetch('/api/resume', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
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
                </CardContent>
            </Card>
        </div>
    );
}