'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, getApiUrl } from '@/lib/utils';
import { PromptInput, PromptInputAction, PromptInputActions, PromptInputTextarea } from '../ui/prompt-input';
import { Message, MessageAvatar, MessageContent } from '../ui/message';
import { PromptSuggestion } from '../ui/prompt-suggestion';
import { ArrowUp, Square } from 'lucide-react';

// Define our own Message type
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  resumeId: number;
  userId: string;
  resumeTitle: string;
}

export function ChatInterface({ resumeId, userId, resumeTitle }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', content: `Ask me anything about *${resumeTitle}*...` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Keep showSuggestions for future use
  const [showSuggestions, setShowSuggestions] = useState(true);


  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll on new messages
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (value = input) => {
    if ((!value && !input) || isLoading) return;

    const messageToSend = value || input;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: messageToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages, // Send the full history
          userId,
          resumeId,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';
      const assistantMessageId = crypto.randomUUID();

      // Add a placeholder for the assistant's message to the UI
      setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

      // --- This is the core manual streaming logic ---
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantResponse += chunk;

        // Update the assistant's message in the state as chunks arrive
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId ? { ...msg, content: assistantResponse } : msg
        ));
      }

    } catch (error) {
      console.error("Streaming failed:", error);
      const errorId = crypto.randomUUID();
      setMessages(prev => [...prev, { id: errorId, role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto w-full">
      <Card className="flex flex-col flex-1 overflow-hidden">
        <CardHeader className="border-b p-4">
          <CardTitle>Resume Assistant</CardTitle>
          <CardDescription>Ask me anything about your resume</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex gap-3',
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <Message className={cn(
                  'max-w-[80%]',
                  m.role === 'user' ? 'ml-auto' : 'mr-auto'
                )}>
                  <MessageAvatar
                    src={m.role === 'assistant' ? '/bot-avatar.png' : '/user-avatar.png'}
                    alt={m.role}
                    fallback={m.role === 'assistant' ? 'AI' : 'U'}
                    className="bg-primary/10"
                  />
                  {m.role === 'assistant' ? (
                    <MessageContent
                      markdown
                      className={cn(
                        'text-sm bg-muted',
                        'prose prose-sm max-w-none prose-p:my-0',
                        'whitespace-pre-wrap'
                      )}
                    >
                      {m.content}
                    </MessageContent>
                  ) : (
                    <MessageContent
                      markdown
                      className={cn(
                        'text-sm bg-primary text-primary-foreground',
                        'prose prose-sm max-w-none prose-p:my-0 prose-invert'
                      )}
                    >
                      {m.content}
                    </MessageContent>
                  )}
                </Message>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-start gap-3">
                <MessageAvatar
                  src="/bot-avatar.png"
                  alt="assistant"
                  fallback="AI"
                  className="bg-primary/10"
                />
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-4 bg-background/50 backdrop-blur-sm">
            {showSuggestions && messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 mb-3">
                <PromptSuggestion onClick={() => handleSubmit("Summarize my work experience")}>
                  Summarize my work experience
                </PromptSuggestion>
                <PromptSuggestion onClick={() => handleSubmit("What are my key skills?")}>
                  What are my key skills?
                </PromptSuggestion>
                <PromptSuggestion onClick={() => handleSubmit("Suggest improvements for my resume")}>
                  Suggest improvements
                </PromptSuggestion>
                <PromptSuggestion onClick={() => handleSubmit("What roles would I be a good fit for?")}>
                  Role suggestions
                </PromptSuggestion>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="w-full">
                <div className="flex items-center">
                  <PromptInput
                    value={input}
                    onValueChange={(value) => {
                      setInput(value);
                      if (value) setShowSuggestions(false);
                      else if (messages.length <= 1) setShowSuggestions(true);
                    }}
                    onSubmit={handleSubmit}
                    className="w-full p-2 flex"
                  >
                    <PromptInputTextarea
                      placeholder={messages.length > 1 ? "Ask me anything..." : "Ask about my experience, skills, or request resume advice..."}
                    />
                    <PromptInputActions>
                      <PromptInputAction
                        tooltip={isLoading ? "Stop generation" : "Send message"}
                      >
                        <Button
                          type="submit"
                          variant="default"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          disabled={!input.trim() || isLoading}
                        >
                          {isLoading ? (
                            <Square className="size-5 fill-current" />
                          ) : (
                            <ArrowUp className="size-5" />
                          )}
                        </Button>
                      </PromptInputAction>
                    </PromptInputActions>
                  </PromptInput>
                </div>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}