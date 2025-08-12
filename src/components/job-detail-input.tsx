"use client"

import { useState, useCallback, ChangeEvent } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, ArrowRight, FileText, Loader2, UploadCloud, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type InputType = 'text' | 'file'

interface JobDetailInputProps {
  onAnalyze: (input: string | FormData, type: InputType) => Promise<void> | void
  isLoading?: boolean
  className?: string
}

export default function JobDetailInput({
  onAnalyze,
  isLoading = false,
  className,
}: JobDetailInputProps) {
  const [jobDescription, setJobDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<InputType>('text')
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setJobDescription(value)
    setError(value.trim().length === 0 ? 'Please enter a job description' : null)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    // Reset error state when a new file is selected
    setError(null)
    
    if (!file) {
      setSelectedFile(null)
      return
    }

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      e.target.value = ''
      setSelectedFile(null)
      return
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      e.target.value = ''
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const removeFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (activeTab === 'text') {
        if (jobDescription.trim().length === 0) {
          setError('Please enter a job description')
          return
        }
        // Send text to parent component
        await onAnalyze(jobDescription, 'text')
      } else {
        if (!selectedFile) {
          setError('Please select a PDF file')
          return
        }
        
        // Create FormData for file upload
        const formData = new FormData()
        formData.append('file', selectedFile)
        
        // Send file to parent component
        await onAnalyze(formData, 'file')
      }
    } catch (error) {
      console.error('Error submitting job details:', error)
      setError('Failed to process your request. Please try again.')
    }
  }

  return (
    <div className={cn('w-full max-w-3xl space-y-4', className)}>
      <div className="">
        <Tabs 
          className='w-full'
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as InputType)}
        >
          <TabsList className='w-full gap-2'>
            <TabsTrigger value="text">
              Paste Text
            </TabsTrigger>
            <TabsTrigger value="file">
              Upload PDF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <Textarea
              placeholder="Paste job description here..."
              className="min-h-[200px] w-full leading-relaxed"
              value={jobDescription}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </TabsContent>

          <TabsContent value="file">
            {selectedFile ? (
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF (max. 10MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex justify-between items-center">
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <Button
          type="submit"
          onClick={handleSubmit}
          className="h-10 px-6 ml-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze Job Description
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
