// src/app/signin/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { signIn } from 'next-auth/react';

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

// 1. Define the Zod schema for the sign-in form. It's simpler than sign-up.
const formSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email.' }),
    password: z.string().min(1, { message: 'Password is required.' }),
});

// Infer the form type from the schema
type SignInFormValues = z.infer<typeof formSchema>;

export default function SignIn() {

    const router = useRouter();
    const session = useSession();
    useEffect(() => {
        if (session?.data?.user) {
            router.push('/dashboard');
        }
    }, [router, session]);


    // 2. Initialize react-hook-form
    const form = useForm<SignInFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    // 3. Set up mutation using React Query to handle the sign-in logic
    const { mutate: signInWithCredentials, isPending } = useMutation({
        mutationFn: async ({ email, password }: SignInFormValues) => {
            // Use the signIn function from NextAuth for 'credentials'
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false, // IMPORTANT: Do not redirect automatically
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            return result;
        },
        onSuccess: () => {
            // On success, NextAuth handles the session. We can redirect.
            toast.success('Signed in successfully!');
            router.push('/dashboard'); // Or any other protected route
            router.refresh(); // Refresh the page to update server component data
        },
        onError: () => {
            // Handle different errors, like wrong password
            toast.error('Invalid email or password. Please try again.');
        },
    });

    // 4. Handle form submission
    const onSubmit = (values: SignInFormValues) => {
        signInWithCredentials(values);
    };

    // 5. Handle social sign-ins (this is the same function for both sign-up and sign-in)
    const handleSocialSignIn = (provider: 'google' | 'github') => {
        signIn(provider, { callbackUrl: '/dashboard' });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                    <CardDescription>
                        Sign in to your account to continue where you left off.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="name@example.com"
                                                {...field}
                                                disabled={isPending}
                                            />
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
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                {...field}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Sign In
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
                        <Button
                            variant="outline"
                            onClick={() => handleSocialSignIn('google')}
                            disabled={isPending}
                        >
                            <Chrome className="mr-2 h-4 w-4" />
                            Google
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleSocialSignIn('github')}
                            disabled={isPending}
                        >
                            <Github className="mr-2 h-4 w-4" />
                            GitHub
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link href="/signup" className="font-semibold text-primary hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}