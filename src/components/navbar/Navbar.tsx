// src/components/navbar.tsx
import Link from 'next/link';
import { BotMessageSquare } from 'lucide-react';
import { UserNav } from './user-nav';

export const Navbar = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <BotMessageSquare className="h-6 w-6 text-primary" />
                        <span className="hidden font-bold sm:inline-block">
                            ResumeGPT
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link
                            href="/dashboard"
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            Dashboard
                        </Link>
                        {/* Add more static links here if you want */}
                    </nav>
                </div>

                {/* Mobile Menu Icon (optional, for future use) */}
                <div className="md:hidden">
                    <BotMessageSquare className="h-6 w-6 text-primary" />
                </div>

                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="flex items-center space-x-2">
                        {/* The UserNav component handles all auth logic */}
                        <UserNav />
                    </nav>
                </div>
            </div>
        </header>
    );
};