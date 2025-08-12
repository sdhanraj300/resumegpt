import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const existingUser = await db.user.findUnique({
            where: { email: email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await db.user.create({
            data: {
                name,
                email,
                hashedPassword,
            },
        });

        const { hashedPassword: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            message: 'User created successfully',
            user: userWithoutPassword,
        }, { status: 201 });

    } catch (error) {
        console.error('[REGISTER_API_ERROR]', error);
        return NextResponse.json(
            { error: 'An internal error occurred' },
            { status: 500 }
        );
    }
}