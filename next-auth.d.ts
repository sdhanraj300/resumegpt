// next-auth.d.ts

import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

// Extend the default JWT type to include the 'id'
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
  }
}

// Extend the default Session's User type to include the 'id'
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
  }
}