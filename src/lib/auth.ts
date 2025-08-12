import { AuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

// Export the authOptions object from this central file
export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(db),
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }
                const user = await db.user.findUnique({
                    where: { email: credentials.email },
                });
                if (!user || !user.hashedPassword) {
                    return null;
                }
                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.hashedPassword
                );
                if (isPasswordValid) {
                    return user;
                }
                return null;
            },
        }),
    ],
    secret: process.env.AUTH_SECRET,
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/signin',
    },
    callbacks: {
        async signIn({ account, profile }) {
            if (account?.provider === 'credentials') return true;

            if (!profile?.email) {
                throw new Error('No email found');
            }

            const existingUser = await db.user.findUnique({
                where: { email: profile.email },
                include: { accounts: true }
            });

            if (existingUser) {
                const hasAccount = existingUser.accounts.some(
                    acc => acc.provider === account?.provider &&
                        acc.providerAccountId === account?.providerAccountId
                );

                if (!hasAccount) {
                    await db.account.create({
                        data: {
                            userId: existingUser.id,
                            type: 'oauth',
                            provider: account?.provider || '',
                            providerAccountId: account?.providerAccountId || '',
                            access_token: account?.access_token,
                            refresh_token: account?.refresh_token,
                            expires_at: account?.expires_at,
                            token_type: account?.token_type,
                            scope: account?.scope,
                            id_token: account?.id_token,
                        }
                    });
                }
                return true;
            }
            return true;
        },
        session: ({ session, token }) => {
            if (session.user) {
                session.user.id = token.sub!;
            }
            return session;
        },
        jwt: ({ token, user }) => {
            if (user) {
                token.id = user.id;
            }
            return token;
        }
    },
};