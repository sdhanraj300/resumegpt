// src/components/user-nav.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, User, LayoutDashboard } from 'lucide-react';

export function UserNav() {
    const { data: session, status } = useSession();

    // Loading state
    if (status === 'loading') {
        return (
            <Button variant="ghost" size="icon">
                <Loader2 className="h-5 w-5 animate-spin" />
            </Button>
        );
    }

    // Unauthenticated state
    if (status === 'unauthenticated') {
        return (
            <Button asChild>
                <Link href="/signin">Sign In</Link>
            </Button>
        );
    }

    // Authenticated state
    if (status === 'authenticated' && session.user) {
        // Get user initials for the avatar fallback
        const userInitials = session.user.name
            ?.split(' ')
            .map(n => n[0])
            .join('');

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10 text-black">
                            <AvatarImage src={session.user.image ?? ''} alt={session.user.name ?? ''} />
                            <AvatarFallback>{userInitials ?? <User />}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {session.user.name}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {session.user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/dashboard">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return null;
}