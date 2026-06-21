# WebAuthn / FIDO2 Integration Research Report

**Stack:** Next.js 16 App Router, TypeScript 6, NextAuth v5 beta, Prisma 7, PostgreSQL  
**Goal:** Add passkeys alongside (or instead of) the existing TOTP 2FA flow.

> **Scope:** Research only. No code was implemented in the repository.

---

## 1. Recommended WebAuthn Library

**Primary recommendation: `@simplewebauthn/server` + `@simplewebauthn/browser`**

| Library | Why / Why not |
|---------|---------------|
| **@simplewebAuthn/server** | TypeScript-first, maintained by the WebAuthn community, wraps the full server ceremony (challenge generation, attestation/assertion verification, counter/backup-flag parsing). Best fit for this stack. |
| `@passwordless-id/webauthn` | Lightweight, but more limited verification API and smaller ecosystem. |
| `fido2-lib` | Powerful but low-level; more code to write and maintain. |
| `@github/webauthn-json` | Useful for serialization only; does not verify on the server. |
| `@productiongrade/passkeys` | Wrapper around SimpleWebAuthn; adds abstraction but couples you to another layer. |

### Recommended versions

```bash
npm install @simplewebauthn/server@13.3.0 @simplewebauthn/browser@13.0.0
```

Node 20+ is required. The project is already on Next.js 16 / TypeScript 6, so this is compatible.

---

## 2. Required Environment Variables

| Variable | Example (dev) | Example (prod) | Purpose |
|----------|---------------|----------------|---------|
| `WEBAUTHN_RP_ID` | `localhost` | `nedcloud.com` | Relying Party ID. Must be a registrable domain suffix of the origin. |
| `WEBAUTHN_RP_NAME` | `Nedcloud Solutions` | `Nedcloud Solutions` | Human-readable name shown in the authenticator prompt. |
| `WEBAUTHN_ORIGIN` | `http://localhost:3000` | `https://nedcloud.com` | Exact origin (protocol + host + port) where requests originate. |

### Rules

- `RP_ID` must be the domain (or a suffix) of `ORIGIN`.
- `localhost` works for `http://localhost:*` in modern browsers as a secure-context exception.
- In production, `ORIGIN` must be `https://` and the certificate must be trusted (not self-signed).
- If the app is behind a reverse proxy, read `X-Forwarded-Host` / `X-Forwarded-Proto` to derive the public origin, or set the env vars explicitly.

---

## 3. Integration with NextAuth v5 Credentials Providers

The existing project uses two credentials providers:

1. `credentials` — validates password, throws `2FA_REQUIRED` if TOTP is enabled.
2. `credentials-2fa` — accepts `userId` after TOTP verification and returns the session.

WebAuthn fits as a **third credentials provider** that is invoked after the browser ceremony.

### Recommended provider shape

```ts
Credentials({
  id: 'webauthn',
  name: 'webauthn',
  credentials: {
    userId: { label: 'User ID', type: 'text' },
    credentialId: { label: 'Credential ID', type: 'text' },
  },
  async authorize(credentials) {
    if (!credentials?.userId) return null

    const user = await prisma.user.findUnique({
      where: { id: credentials.userId as string },
    })

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  },
})
```

### How the flow works

1. User enters email/password and submits.
2. Server validates password.
3. If the user has registered passkeys, the server returns `WEBAUTHN_REQUIRED` (or proceed directly for passwordless).
4. Client calls `/api/webauthn/authenticate/options`.
5. Browser calls `navigator.credentials.get()`.
6. Client posts the assertion to `/api/webauthn/authenticate/verify`.
7. If verification succeeds, the route returns the user object.
8. Client calls `signIn('webauthn', { userId: user.id, redirect: false })`.
9. NextAuth issues the JWT/session the same way it does for `credentials-2fa`.

### Why not use the built-in `next-auth/providers/passkey`?

Auth.js has an **experimental** `Passkey` provider, but it is currently not recommended for production and requires `@auth/prisma-adapter` plus an `Authenticator` table managed by the adapter. The project uses a **custom credentials + JWT session** pattern, so a custom SimpleWebAuthn integration is more predictable and keeps control over the schema and flow.

---

## 4. Challenge Storage Without Redis

### Recommended approach: short-lived DB table

Because the project already uses PostgreSQL + Prisma, store challenges in a dedicated table. This avoids the serverless/edge problem of in-memory maps and is simpler than introducing Redis.

### Prisma schema addition

```prisma
model WebAuthnChallenge {
  id        String   @id @default(cuid())
  userId    String?
  challenge String   @unique
  purpose   String   // "registration" | "authentication"
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([challenge])
  @@map("webauthn_challenges")
}
```

### Lifecycle

1. Generate options → store `challenge` with a short TTL (e.g. 2 minutes).
2. Verify response → look up by `challenge`, compare `expectedChallenge`, then **delete the row immediately**.
3. Run a periodic cleanup (or rely on a cron/DB job) to delete expired rows.

### Alternatives considered

| Approach | Verdict |
|----------|---------|
| In-memory `Map` | Fails in serverless/edge, multi-instance deployments, and Next.js dev HMR. Not recommended. |
| Encrypted signed cookie / session | Possible, but NextAuth JWT strategy does not use server-side sessions; implementing an independent encrypted cookie adds complexity. |
| DB table | **Recommended**: durable, works across instances, no new infrastructure. |

---

## 5. Browser Support and HTTPS / Localhost

### Secure context requirement

WebAuthn requires a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts):

- Production: valid HTTPS only.
- Localhost: `http://localhost` and `*.localhost` are treated as secure contexts in Chromium, Firefox, and Safari.
- Do **not** rely on `http://192.168.x.x`, `http://myapp.local`, or self-signed certs in production.

### Browser matrix

| Browser / OS | Passkeys / Platform Authenticator | Notes |
|--------------|-----------------------------------|-------|
| Chrome 67+ | ✅ | Cross-platform; syncs passkeys via Google Password Manager. |
| Firefox 60+ | ✅ | Uses OS APIs where available. |
| Safari 13+ (macOS/iOS) | ✅ | Touch ID / Face ID. User gesture required for platform authenticator. |
| Edge 18+ | ✅ | Delegates to Windows Hello on Windows. |
| Chrome on iOS | ✅ | Uses Apple’s WebKit/WebAuthn API (all browsers on iOS do). |

### Local development tips

- Use `http://localhost:3000` with `RP_ID=localhost` and `RP_ORIGIN=http://localhost:3000`.
- If you need HTTPS locally, use `mkcert` for a trusted local certificate:
  ```bash
  mkcert -install
  mkcert localhost 127.0.0.1 ::1
  ```
- Safari on macOS requires a user gesture (click/tap) to trigger platform authenticators.

---

## 6. Security Best Practices

### Attestation

- Use `attestationType: 'none'` for most deployments. It avoids the complexity of attestation root certificates while still giving you the public key.
- Use `'direct'` only if you need to enforce authenticator models (enterprise/ high-assurance scenarios). You must then maintain a list of trusted AAGUIDs/root certs.
- `'indirect'` is rarely useful in practice.

### User verification

- For **passkey login**, set `userVerification: 'required'` and `requireUserVerification: true` during both registration and authentication.
- For **2FA only** (passkey as second factor after password), `preferred` may be acceptable, but `required` is safer.

### Counter checks

- Always store `counter` from `registrationInfo.credential.counter`.
- On each authentication, compare `authenticationInfo.newCounter` against the stored value.
- If the new counter is **less than or equal** to the stored counter, treat it as a potential replay / cloned authenticator and reject or flag the credential.

### Backup flags

- `registrationInfo.credentialBackedUp` and `credentialDeviceType` tell you whether the passkey is synced across devices (`multiDevice`) and whether it is backed up.
- Use these to warn users when they have no non-backed-up credential, or to enforce a minimum number of authenticators.

### Preventing lockout

- Never allow WebAuthn to be the **only** authentication method without a recovery path.
- Keep the existing password path.
- Keep TOTP backup codes or introduce WebAuthn-specific recovery codes.
- Allow multiple credentials per user so losing one device does not lock the account.
- Require re-authentication (password + existing 2FA or an existing passkey) before registering a new passkey.

### Other

- One-time challenges: delete the DB row after verification.
- Origin validation: `verifyRegistrationResponse` / `verifyAuthenticationResponse` check `expectedOrigin` and `expectedRPID` for you; never skip them.
- Rate-limit all WebAuthn endpoints using the existing `rateLimit('auth')` middleware.

---

## 7. Recommended API Route Structure

Mirror the existing `/api/2fa/*` conventions:

```
src/app/api/webauthn/
├── register/
│   ├── options/route.ts
│   └── verify/route.ts
├── authenticate/
│   ├── options/route.ts
│   └── verify/route.ts
└── credentials/
    └── route.ts      // optional: list/delete credentials for the logged-in user
```

### 7a. Registration options — `POST /api/webauthn/register/options`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { rateLimit } from '@/lib/rateLimit'

const authRateLimit = rateLimit('auth')

const rpID = process.env.WEBAUTHN_RP_ID!
const rpName = process.env.WEBAUTHN_RP_NAME!
const origin = process.env.WEBAUTHN_ORIGIN!

export async function POST(request: NextRequest) {
  const limited = await authRateLimit(request)
  if (limited) return limited

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const existingCredentials = await prisma.webAuthnCredential.findMany({
    where: { userId: user.id },
  })

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userDisplayName: user.name ?? user.email,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map((cred) => ({
      id: cred.credentialId,
      transports: cred.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required',
    },
  })

  await prisma.webAuthnChallenge.create({
    data: {
      userId: user.id,
      challenge: options.challenge,
      purpose: 'registration',
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    },
  })

  return NextResponse.json(options)
}
```

### 7b. Registration verify — `POST /api/webauthn/register/verify`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'

const rpID = process.env.WEBAUTHN_RP_ID!
const origin = process.env.WEBAUTHN_ORIGIN!

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: RegistrationResponseJSON = await request.json()

  const challengeRow = await prisma.webAuthnChallenge.findUnique({
    where: { challenge: body.response.clientDataJSON ? undefined : body.id }, // look up by challenge value
  })
  // In production, look up the challenge from the options you stored.
  // Simpler: pass the challenge back from the client or store it in the DB keyed by userId+purpose.

  // Example using a stored challenge object fetched from the prior step:
  const expectedChallenge = challengeRow?.challenge
  if (!expectedChallenge || challengeRow.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Challenge expired' }, { status: 400 })
  }

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  })

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo

  await prisma.webAuthnCredential.create({
    data: {
      userId: session.user.id,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: credential.transports ?? [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      rpID,
    },
  })

  await prisma.webAuthnChallenge.delete({ where: { id: challengeRow.id } })

  return NextResponse.json({ verified: true })
}
```

### 7c. Authentication options — `POST /api/webauthn/authenticate/options`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAuthenticationOptions } from '@simplewebauthn/server'

const rpID = process.env.WEBAUTHN_RP_ID!

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email } = body

  const user = await prisma.user.findUnique({
    where: { email },
    include: { webAuthnCredentials: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: user.webAuthnCredentials.map((cred) => ({
      id: cred.credentialId,
      transports: cred.transports as AuthenticatorTransportFuture[],
    })),
  })

  await prisma.webAuthnChallenge.create({
    data: {
      userId: user.id,
      challenge: options.challenge,
      purpose: 'authentication',
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    },
  })

  return NextResponse.json({ options, userId: user.id })
}
```

### 7d. Authentication verify — `POST /api/webauthn/authenticate/verify`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyAuthenticationResponse,
  type WebAuthnCredential,
} from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'

const rpID = process.env.WEBAUTHN_RP_ID!
const origin = process.env.WEBAUTHN_ORIGIN!

export async function POST(request: NextRequest) {
  const body: AuthenticationResponseJSON = await request.json()

  // The client must also send the userId / challenge reference from the options step.
  const { userId } = await request.json() // or read from body

  const credentialRow = await prisma.webAuthnCredential.findUnique({
    where: { credentialId: body.id },
    include: { user: true },
  })
  if (!credentialRow || credentialRow.userId !== userId) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 400 })
  }

  const challengeRow = await prisma.webAuthnChallenge.findFirst({
    where: {
      userId: credentialRow.userId,
      purpose: 'authentication',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!challengeRow) {
    return NextResponse.json({ error: 'Challenge expired' }, { status: 400 })
  }

  const credential: WebAuthnCredential = {
    id: credentialRow.credentialId,
    publicKey: Buffer.from(credentialRow.publicKey, 'base64url'),
    counter: credentialRow.counter,
    transports: credentialRow.transports as AuthenticatorTransportFuture[],
  }

  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: challengeRow.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential,
    requireUserVerification: true,
  })

  if (!verification.verified) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
  }

  await prisma.webAuthnCredential.update({
    where: { id: credentialRow.id },
    data: { counter: verification.authenticationInfo.newCounter },
  })

  await prisma.webAuthnChallenge.delete({ where: { id: challengeRow.id } })

  return NextResponse.json({
    valid: true,
    user: {
      id: credentialRow.user.id,
      email: credentialRow.user.email,
      name: credentialRow.user.name,
      role: credentialRow.user.role,
    },
  })
}
```

---

## 8. Client-Side Hook / Component Snippet

```tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

export function useWebAuthn() {
  const [error, setError] = useState<string | null>(null)

  async function registerPasskey() {
    setError(null)
    try {
      const optsRes = await fetch('/api/webauthn/register/options', {
        method: 'POST',
      })
      const optionsJSON = await optsRes.json()

      const regResponse = await startRegistration({ optionsJSON })

      const verifyRes = await fetch('/api/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regResponse),
      })
      const verifyData = await verifyRes.json()
      if (!verifyData.verified) throw new Error('Registration failed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function authenticateWithPasskey(email: string) {
    setError(null)
    try {
      const optsRes = await fetch('/api/webauthn/authenticate/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const { options, userId } = await optsRes.json()

      const authResponse = await startAuthentication({ optionsJSON: options })

      const verifyRes = await fetch('/api/webauthn/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...authResponse, userId }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyData.valid) throw new Error('Authentication failed')

      await signIn('webauthn', {
        userId,
        credentialId: authResponse.id,
        redirect: false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return { registerPasskey, authenticateWithPasskey, error }
}
```

---

## 9. Recommended Prisma Schema Additions

```prisma
model WebAuthnCredential {
  id            String   @id @default(cuid())
  userId        String
  credentialId  String   @unique
  publicKey     String   // base64url-encoded COSE public key bytes
  counter       Int      @default(0)
  transports    String[] @default([])
  deviceType    String?  // "singleDevice" | "multiDevice"
  backedUp      Boolean  @default(false)
  aaguid        String?  // optional, all-zero on Apple platform authenticators
  rpID          String
  lastUsedAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("webauthn_credentials")
}

model WebAuthnChallenge {
  id        String   @id @default(cuid())
  userId    String?
  challenge String   @unique
  purpose   String   // "registration" | "authentication"
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([challenge])
  @@map("webauthn_challenges")
}
```

Add the relation to `User`:

```prisma
model User {
  // ... existing fields ...
  webAuthnCredentials WebAuthnCredential[]
}
```

---

## 10. Known Pitfalls with NextAuth v5 + WebAuthn

| Issue | Guidance |
|-------|----------|
| **Experimental built-in provider** | `next-auth/providers/passkey` is experimental and requires `@auth/prisma-adapter` + an `Authenticator` table. For production, prefer the custom credentials-provider pattern above. |
| **`authorize` return shape** | Return only `{ id, email, name, role }`. The `jwt` callback already maps `user` into the token. |
| **JWT session strategy** | The project uses `strategy: 'jwt'`, so the WebAuthn provider must return a user object, not a DB adapter account. |
| **`trustHost: true`** | Already set; needed for Docker/reverse-proxy deployments so origin checks inside NextAuth do not fail. |
| **Edge runtime** | SimpleWebAuthn server functions use Node crypto. Keep WebAuthn API routes as Node runtime (default in App Router). Do not mark them `export const runtime = 'edge'`. |
| **Prisma in middleware** | The project uses a separate `proxy.ts` middleware. Do not call Prisma from middleware; use `auth()` only for session checks and route to API routes for DB work. |
| **Custom errors** | To send a custom error code from `authorize`, extend `CredentialsSignin` (exported from `next-auth` in recent betas) or throw `new Error('WEBAUTHN_REQUIRED')` and parse the query string on the login page. |

---

## 11. Summary of Recommendations

1. Use `@simplewebauthn/server@13.3.0` + `@simplewebauthn/browser@13.0.0`.
2. Add `WEBAUTHN_RP_ID`, `WEBAUTHN_RP_NAME`, and `WEBAUTHN_ORIGIN` to `.env.local`.
3. Add a third NextAuth credentials provider (`webauthn`) that returns the user after browser-side verification.
4. Store challenges in a new `WebAuthnChallenge` Prisma table with a 2-minute TTL and delete on use.
5. Store credentials in a new `WebAuthnCredential` Prisma table; update counter on every authentication.
6. Enforce `userVerification: 'required'` and `requireUserVerification: true` for admin use.
7. Use `attestationType: 'none'` unless you need hardware model attestation.
8. Keep password + TOTP as recovery/fallback paths to prevent lockout.
9. Do not use the Edge runtime for WebAuthn API routes.
10. Rate-limit all WebAuthn endpoints using the existing `rateLimit('auth')` helper.

---

## Sources

- SimpleWebAuthn docs: https://simplewebauthn.dev/docs/packages/server
- Auth.js WebAuthn guide: https://authjs.dev/getting-started/authentication/webauthn
- Auth.js Passkey provider: https://authjs.dev/getting-started/providers/passkey
- MDN Web Authentication API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API
- Chromium secure-context origins for WebAuthn: https://chromium.googlesource.com/chromium/src/+/main/content/browser/webauth/origins.md
- WebKit Touch ID / Face ID for the web: https://webkit.org/blog/11312/meet-face-id-and-touch-id-for-the-web/
- Yubico WebAuthn browser support matrix: https://developers.yubico.com/WebAuthn/WebAuthn_Browser_Support/
