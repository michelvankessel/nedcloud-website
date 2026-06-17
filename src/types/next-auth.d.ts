import type { Role } from '../generated/prisma/enums'

declare module 'next-auth' {
  interface User {
    id: string
    role: Role
  }
  interface Session {
    user: User
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}