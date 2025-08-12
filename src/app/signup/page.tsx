// src/app/signup/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { signIn } from 'next-auth/react'; // Import signIn from NextAuth

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Chrome, Github, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { getApiUrl } from '@/lib/utils';
// Zod schema remains the same
const formSchema = z
    .object({
        name: z.string().min(3, { message: 'Name must be at least 3 characters long.' }),
        email: z.string().email({ message: 'Please enter a valid email address.' }),
        password: z
            .string()
            .min(8, { message: 'Password must be at least 8 characters long.' }),
        confirmPassword: z.string(),
    })
    .refine(data => data.password === data.confirmPassword, {
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
    });

type SignUpFormValues = z.infer<typeof formSchema>;

export default function Signup() {
    const router = useRouter();
    const session = useSession();
    useEffect(() => {
        if (session?.data?.user) {
            router.push('/dashboard');
        }
    }, [router, session]);
    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    });

    // This mutation now calls YOUR OWN /api/register endpoint
    const { mutate: registerUser, isPending } = useMutation({
        mutationFn: async ({ name, email, password }: SignUpFormValues) => {
            const response = await fetch(getApiUrl('/api/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create account');
            }
            return response.json();
        },
        onSuccess: async (variables) => {
            toast.success('Account created successfully!');
            // After successful registration, sign the user in automatically
            const signInResponse = await signIn('credentials', {
                email: variables.email,
                password: variables.password,
                redirect: false, // Don't redirect, handle it manually
            });

            if (signInResponse?.ok) {
                router.push('/signin'); // Redirect to dashboard on successful sign-in
            } else {
                // If auto-signin fails, redirect to the sign-in page
                router.push('/signup');
            }
        },
        onError: () => {
            toast.error('Error creating account');
        },
    });

    const onSubmit = (values: SignUpFormValues) => {
        registerUser(values);
    };

    // Social sign-in now uses the signIn function from NextAuth
    const handleSocialSignIn = (provider: 'google' | 'github') => {
        signIn(provider, { callbackUrl: '/dashboard' }); // Redirect to dashboard on success
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Create an Account</CardTitle>
                    <CardDescription>
                        Enter your details below to create your account and get started.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} disabled={isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="name@example.com" {...field} disabled={isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} disabled={isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} disabled={isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Create Account
                            </Button>
                        </form>
                    </Form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => handleSocialSignIn('google')} disabled={isPending}>
                            <Chrome className="mr-2 h-4 w-4" />
                            Google
                        </Button>
                        <Button variant="outline" onClick={() => handleSocialSignIn('github')} disabled={isPending}>
                            <Github className="mr-2 h-4 w-4" />
                            GitHub
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/signin" className="font-semibold text-primary hover:underline">
                            Sign In
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}