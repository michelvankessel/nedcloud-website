# API Reference

This document describes all API endpoints for the Nedcloud Solutions website.

## Authentication

All mutation endpoints (POST, PUT, DELETE) require authentication via NextAuth session.

**Authenticated Request Example:**
```bash
curl -X POST https://nedcloudsolutions.nl/api/services \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"title":"New Service","slug":"new-service","description":"..."}'
```

## Rate Limiting

| Route Type | Limit | Window |
|------------|-------|--------|
| API routes | 100 requests | 60 seconds |
| Auth routes | 10 requests | 60 seconds |

When rate limited, API returns `429 Too Many Requests` with `Retry-After` header.

---

## 2FA Endpoints

### POST /api/2fa/setup

Generate TOTP secret and QR code for 2FA setup.

**Authentication:** Required

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "encryptedSecret": "iv:encrypted",
  "qrCode": "data:image/png;base64,..."
}
```

### POST /api/2fa/verify

Verify TOTP code and enable 2FA.

**Authentication:** Required

**Request:**
```json
{
  "token": "123456",
  "encryptedSecret": "iv:encrypted"
}
```

**Response:**
```json
{
  "success": true,
  "backupCodes": ["A1B2C3D4", "E5F6G7H8"]
}
```

### GET /api/2fa/status

Get 2FA status for current user.

**Authentication:** Required

**Response:**
```json
{
  "enabled": true,
  "verifiedAt": "2026-02-17T10:00:00.000Z"
}
```

### POST /api/2fa/disable

Disable 2FA for current user.

**Authentication:** Required

**Request:**
```json
{
  "token": "123456"
}
```

### POST /api/2fa/login

Verify 2FA during login flow.

**Authentication:** Not required

**Request:**
```json
{
  "email": "admin@example.com",
  "token": "123456"
}
```

---

## Authentication Endpoints

### POST /api/auth/[...all]

NextAuth v5 handlers for authentication.

**Endpoints:**
- `POST /api/auth/signin/credentials` - Sign in with credentials
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/csrf` - Get CSRF token

---

## Services Endpoints

### GET /api/services

List all services.

**Query Parameters:**
- `all=true` - Return all services (admin only, requires auth)

**Response:**
```json
[
  {
    "id": "clk123...",
    "title": "Agentic AI",
    "slug": "agentic-ai",
    "description": "...",
    "content": "...",
    "icon": "brain",
    "features": ["Feature 1", "Feature 2"],
    "order": 1,
    "published": true
  }
]
```

### POST /api/services

Create a new service.

**Authentication:** Required (ADMIN/EDITOR)

**Request:**
```json
{
  "title": "New Service",
  "slug": "new-service",
  "description": "Short description",
  "content": "Full content HTML",
  "icon": "icon-name",
  "features": ["Feature 1"],
  "order": 0,
  "published": false
}
```

### PUT /api/services/[id]

Update a service.

**Authentication:** Required (ADMIN/EDITOR)

### DELETE /api/services/[id]

Delete a service.

**Authentication:** Required (ADMIN/EDITOR)

---

## Projects Endpoints

### GET /api/projects

List all projects.

**Query Parameters:**
- `all=true` - Return all projects (admin only)

### POST /api/projects

Create a new project.

**Authentication:** Required (ADMIN/EDITOR)

**Request:**
```json
{
  "title": "Project Name",
  "slug": "project-name",
  "description": "Short description",
  "content": "Full description",
  "image": "/images/project.jpg",
  "technologies": ["Next.js", "TypeScript"],
  "url": "https://example.com",
  "github": "https://github.com/...",
  "featured": true,
  "published": true,
  "startDate": "2026-01-01",
  "serviceId": "clk123..."
}
```

### PUT /api/projects/[id]

Update a project.

### DELETE /api/projects/[id]

Delete a project.

---

## Blog Endpoints

### GET /api/blog

List all blog posts.

**Query Parameters:**
- `all=true` - Return all posts (admin only)

### POST /api/blog

Create a new blog post.

**Authentication:** Required (ADMIN/EDITOR)

**Request:**
```json
{
  "title": "Post Title",
  "slug": "post-title",
  "excerpt": "Short excerpt",
  "content": "Full content",
  "coverImage": "/images/cover.jpg",
  "tags": ["tag1", "tag2"],
  "featured": false,
  "published": true
}
```

### PUT /api/blog/[id]

Update a blog post.

### DELETE /api/blog/[id]

Delete a blog post.

---

## Testimonials Endpoints

### GET /api/testimonials

List testimonials.

**Query Parameters:**
- `all=true` - Return all testimonials (admin only)
- Default: Returns only approved, featured testimonials

### POST /api/testimonials

Create a testimonial.

**Authentication:** Required (ADMIN/EDITOR)

**Request:**
```json
{
  "name": "Client Name",
  "role": "CEO",
  "company": "Company",
  "content": "Testimonial text...",
  "avatar": "/images/avatar.jpg",
  "rating": 5,
  "featured": true,
  "approved": true
}
```

### PUT /api/testimonials/[id]

Update a testimonial.

### DELETE /api/testimonials/[id]

Delete a testimonial.

---

## Team Endpoints

### GET /api/team

List team members.

**Query Parameters:**
- `all=true` - Return all members (admin only)

### POST /api/team

Create a team member.

**Authentication:** Required (ADMIN/EDITOR)

**Request:**
```json
{
  "name": "Team Member",
  "role": "Developer",
  "bio": "Bio text...",
  "image": "/images/member.jpg",
  "email": "member@example.com",
  "linkedin": "https://linkedin.com/in/...",
  "github": "https://github.com/...",
  "twitter": "https://twitter.com/...",
  "order": 1,
  "published": true
}
```

### PUT /api/team/[id]

Update a team member.

### DELETE /api/team/[id]

Delete a team member.

---

## Contact Endpoints

### GET /api/contact

List contact submissions.

**Authentication:** Required (ADMIN/EDITOR)

### POST /api/contact

Submit a contact form (public endpoint).

**Request:**
```json
{
  "name": "Sender Name",
  "email": "sender@example.com",
  "company": "Company",
  "subject": "Inquiry",
  "message": "Message text..."
}
```

### PUT /api/contact/[id]

Update contact submission status.

### DELETE /api/contact/[id]

Delete a contact submission.

---

## User Endpoints

### PATCH /api/user

Update current user profile.

**Authentication:** Required

**Request:**
```json
{
  "name": "New Name"
}
```

### POST /api/user/password

Change password.

**Authentication:** Required

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message"
}
```

**Common HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Input Validation

All inputs are validated using Zod schemas defined in `src/lib/validations.ts`.

**Common Validation Rules:**
- Title: 1-200 characters
- Content: 1-100,000 characters
- Password: minimum 8 characters
- Email: valid email format
- Slug: lowercase, alphanumeric with hyphens
