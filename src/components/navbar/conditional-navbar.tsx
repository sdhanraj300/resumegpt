// src/components/conditional-navbar.tsx
'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar'; // Import your existing Navbar

export const ConditionalNavbar = () => {
    const pathname = usePathname();

    // If the current path is the homepage, render nothing.
    if (pathname === '/') {
        return null;
    }

    // For all other pages, render the Navbar.
    return <Navbar />;
};