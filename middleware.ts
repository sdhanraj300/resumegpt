import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    const session = req.nextUrl.searchParams.get('session');
    if (!session) {
        return NextResponse.redirect(new URL('/signin', req.url));
    }
    return NextResponse.next();
}