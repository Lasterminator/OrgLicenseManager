# OrgLicenseManager

A production-ready, multi-tenant **Organization & License Management API** built with **.NET 8**. It powers the backend for a SaaS platform where companies create organizations, invite team members via email, and manage software licenses with automatic renewal -- all governed by fine-grained role-based access control.

---

## Table of Contents

- [Business Context](#business-context)
- [User Stories](#user-stories)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Getting Started (Docker)](#getting-started-docker)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Pagination, Sorting & Filtering](#pagination-sorting--filtering)
- [Data Models](#data-models)
- [Background Services](#background-services)
- [Email System](#email-system)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Project Structure](#project-structure)

---

## Business Context

### The Problem

SaaS platforms need a way to manage **who** has access to **what**. Organizations sign up, invite their team, purchase licenses, and assign those licenses to specific users. Admins need system-wide oversight. Owners need full control over their org. Members need a seamless onboarding experience.

### What This System Does

**OrgLicenseManager** is the backend API that handles all of this:

- **Organizations** are the top-level tenant. A company or team creates an organization and becomes its Owner.
- **Members** are users who belong to one or more organizations. Each member has a role (Owner, Admin, or Member) that determines what they can do.
- **Licenses** are subscriptions tied to an organization. They have expiration dates and can auto-renew. Admins create licenses; org owners/admins assign them to specific users.
- **Invitations** are email-based. An org owner invites someone by email, the system sends a styled HTML email with a one-click accept link, and the invited user joins the org with the assigned role.

### Authorization Model

| Role | Scope | What They Can Do |
|------|-------|-----------------|
| **Admin** | System-wide | Create/update/revoke licenses for any org, configure system settings |
| **Owner** | Per-organization | Full org control: update/delete org, invite/remove users, assign licenses, manage roles |
| **Admin** (org-level) | Per-organization | Same as Owner, except cannot delete the organization |
| **Member** | Per-organization | View org details, view own membership, leave the organization |

Owners cannot be removed by other owners/admins. Only the owner themselves can leave. Role changes and removals cascade properly (e.g., unassigning a license when removing a member).

---

## User Stories

### As a System Admin

- Create a license for any organization (with optional auto-renewal)
- View all licenses across the platform (paginated, searchable)
- Update license properties (extend expiration, toggle auto-renewal)
- Revoke/cancel a license
- View and update global license settings (default expiration time)

### As an Organization Owner / Admin

- Create a new organization (creator becomes Owner automatically)
- Update organization name and description
- Delete the organization (Owner only -- cascades all data)
- Invite users by email (sends a styled HTML invitation email)
- Remove members from the organization
- Assign a license to a specific member
- Unassign a license from a member
- View all members with their roles and license status (paginated)
- View a specific member's details
- Change a member's role (Owner, Admin, Member)
- View all pending invitations (paginated)
- View or cancel a specific invitation

### As a Regular User

- View all organizations I belong to
- View details of a specific organization I'm part of
- Accept an invitation to join an organization (via API call or one-click email link)
- Leave an organization I'm part of

### As the System (Automated)

- Automatically renew expired licenses when auto-renewal is enabled (background job runs every 60 seconds)
- Enforce authorization on every endpoint -- users can only access what their role permits
- Create user records on-the-fly during login (if the user doesn't exist yet)

---

## Architecture Overview

```
Client (Swagger UI / HTTP)
    |
    v
[JWT Authentication Middleware]
    |
    v
[Global Exception Handling Middleware] -- catches all exceptions, returns ProblemDetails
    |
    v
[Controllers] -- thin layer, maps HTTP to service calls
    |
    v
[Services] -- business logic, authorization checks, validation
    |
    v
[Entity Framework Core] -- ORM, PostgreSQL
    |
    v
[PostgreSQL Database]

[Background Service: LicenseRenewalService] -- runs every 60s, renews expired licenses
```

The architecture follows a **Controller -> Service -> EF Core** pattern:

- **Controllers** are thin -- they handle HTTP concerns (routing, request/response mapping) and delegate to services.
- **Services** contain all business logic, validation, and authorization checks. Each service gets the current user context and enforces permissions.
- **Entities** are EF Core models that map to database tables.
- **Contracts** are request/response DTOs in a separate project, keeping the API contract decoupled from internals.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | .NET 8 (ASP.NET Core Web API) |
| Database | PostgreSQL |
| ORM | Entity Framework Core 8 |
| Authentication | JWT Bearer Tokens (HS256) |
| Logging | Serilog (console + rolling file) |
| API Docs | Swagger / OpenAPI 3.0 |
| Email | SMTP (Gmail, Outlook, SendGrid, etc.) |
| Background Jobs | .NET `BackgroundService` (hosted service) |
| Containerization | Docker (PostgreSQL) |

---

## Getting Started (Docker)

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Start PostgreSQL

```bash
docker run --name orglicensemanager-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=orglicensemanager \
  -p 5432:5432 \
  -d postgres:16
```

### 2. Configure the Application

```bash
cd OrgLicenseManager
cp appsettings.example.json appsettings.json
```

Edit `appsettings.json` -- the defaults work out of the box with the Docker command above:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=orglicensemanager;Username=postgres;Password=password"
  },
  "JwtSettings": {
    "SecretKey": "change-this-to-a-long-random-string-at-least-32-chars",
    "Issuer": "OrgLicenseManagerAPI",
    "Audience": "OrgLicenseManagerAPIUsers",
    "ExpirationMinutes": 60
  }
}
```

> **Note:** `appsettings.json` is gitignored. It will never be committed. See [Configuration](#configuration) for email setup.

### 3. Apply Database Migrations

```bash
dotnet ef database update --project OrgLicenseManager
```

### 4. Run the Application

```bash
dotnet run --project OrgLicenseManager
```

### 5. Open Swagger UI

Navigate to **http://localhost:5228** -- the Swagger UI loads at the root.

### Cleanup

```bash
# Stop and remove the database container
docker stop orglicensemanager-db && docker rm orglicensemanager-db
```

---

## Authentication

The API uses **JWT Bearer token** authentication. All endpoints except `/api/auth/login` require a valid token.

### Login (Get a Token)

```http
POST /api/auth/login
Content-Type: application/json

{
  "userId": "user-123",
  "email": "alice@example.com",
  "role": "User"
}
```

The `role` field is the **system role**: `"User"` for regular users, `"Admin"` for system administrators.

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2026-01-15T16:00:00Z",
  "userId": "user-123",
  "email": "alice@example.com",
  "role": "User"
}
```

### Using the Token

Add to every request:
```
Authorization: Bearer <your-token>
```

In Swagger UI, click **Authorize** and enter: `Bearer <your-token>`

### How Users Are Created

Users are created **automatically** on first login. If you call `/api/auth/login` with a `userId` that doesn't exist, the system creates the user record. Subsequent logins with the same `userId` update the user's email and role if they've changed.

---

## API Reference

### Auth (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Get a JWT token | No |
| GET | `/api/auth/claims` | View your JWT claims | Yes |

---

### Admin: License Management (`/api/admin/licenses`)

> Requires system role: `Admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/licenses/organizations/{orgId}` | Create a license for an org |
| GET | `/api/admin/licenses` | List all licenses (paginated) |
| PUT | `/api/admin/licenses/{licenseId}` | Update license properties |
| DELETE | `/api/admin/licenses/{licenseId}` | Cancel/revoke a license |
| GET | `/api/admin/licenses/settings` | Get default expiration settings |
| PUT | `/api/admin/licenses/settings` | Update default expiration (in minutes) |

**Create License:**
```json
POST /api/admin/licenses/organizations/{orgId}
{ "autoRenewal": true }
```

**Update License:**
```json
PUT /api/admin/licenses/{licenseId}
{ "expiresAt": "2026-12-31T23:59:59Z", "autoRenewal": false }
```

**Update Settings:**
```json
PUT /api/admin/licenses/settings
{ "expirationMinutes": 30 }
```

---

### Organizations (`/api/organizations`)

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|--------------|
| POST | `/api/organizations` | Create a new organization | Any authenticated user |
| GET | `/api/organizations` | List my organizations | Any authenticated user |
| GET | `/api/organizations/{orgId}` | Get org details | Org member |
| PUT | `/api/organizations/{orgId}` | Update org | Owner or Admin |
| DELETE | `/api/organizations/{orgId}` | Delete org | Owner only |

**Create Organization:**
```json
POST /api/organizations
{ "name": "Acme Corp", "description": "Building the future" }
```

---

### Members (`/api/organizations/{orgId}/users`)

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|--------------|
| GET | `.../users` | List all members (paginated) | Org member |
| GET | `.../users/{userId}` | Get member details | Org member |
| PUT | `.../users/{userId}/role` | Change member's role | Owner or Admin |
| POST | `.../users/{userId}/remove` | Remove member | Owner or Admin |
| POST | `.../users/{userId}/license` | Assign license to member | Owner or Admin |
| DELETE | `.../users/{userId}/license` | Unassign license | Owner or Admin |

**Update Role:**
```json
PUT /api/organizations/{orgId}/users/{userId}/role
{ "role": "Admin" }
```

**Assign License:**
```json
POST /api/organizations/{orgId}/users/{userId}/license
{ "licenseId": "license-guid-here" }
```

---

### Invitations (`/api/organizations/{orgId}/invitations`)

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|--------------|
| POST | `.../invite` | Send invitation email | Owner or Admin |
| GET | `.../invitations` | List invitations (paginated) | Owner or Admin |
| GET | `.../invitations/{id}` | Get invitation details | Owner or Admin |
| DELETE | `.../invitations/{id}` | Cancel invitation | Owner or Admin |

**Invite User:**
```json
POST /api/organizations/{orgId}/invite
{ "email": "bob@example.com", "role": "Member" }
```

---

### Memberships (`/api/memberships`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memberships` | List all orgs I belong to |
| GET | `/api/memberships/{orgId}` | Get my membership in a specific org |
| DELETE | `/api/memberships/{orgId}` | Leave an organization |
| POST | `/api/memberships/invitations/accept` | Accept invitation (via token) |
| GET | `/api/memberships/invitations/accept?token=...` | Accept invitation (via email link) |

**Accept Invitation:**
```json
POST /api/memberships/invitations/accept
{ "token": "invitation-token-from-email" }
```

---

### Organization Licenses (`/api/organizations/{orgId}/licenses`)

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|--------------|
| GET | `.../licenses` | List org's licenses (paginated) | Org member |

---

## Pagination, Sorting & Filtering

All list endpoints support pagination via query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number (1-indexed) |
| `pageSize` | int | 10 | Items per page (max 100) |
| `sortBy` | string | varies | Field to sort by |
| `sortDescending` | bool | false | Descending order |
| `search` | string | - | Free-text search/filter |

**Example:**
```
GET /api/admin/licenses?page=1&pageSize=5&sortBy=expiresAt&sortDescending=true&search=acme
```

**Response envelope:**
```json
{
  "items": [ ... ],
  "page": 1,
  "pageSize": 5,
  "totalCount": 42,
  "totalPages": 9,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

**Sortable fields for licenses:** `createdAt`, `expiresAt`, `isActive`, `autoRenewal`, `organizationId`

**Search:** filters by organization name or assigned user email.

---

## Data Models

### Organization

| Field | Type | Description |
|-------|------|-------------|
| id | GUID | Primary key |
| name | string (200) | Organization name |
| description | string (1000) | Optional description |
| createdAt | datetime | When created |
| updatedAt | datetime | Last modified |

### User

| Field | Type | Description |
|-------|------|-------------|
| id | GUID | Internal ID (auto-generated) |
| externalId | string (100) | The `userId` from login |
| email | string (256) | User's email |
| role | string (50) | System role: User or Admin |

### License

| Field | Type | Description |
|-------|------|-------------|
| id | GUID | Primary key |
| organizationId | GUID | Which org this license belongs to |
| assignedToUserId | GUID? | Which user it's assigned to (nullable) |
| expiresAt | datetime | Expiration timestamp |
| autoRenewal | bool | Whether the background job should auto-renew |
| isActive | bool | Whether the license is active (false = revoked) |

### OrganizationMembership

| Field | Type | Description |
|-------|------|-------------|
| id | GUID | Primary key |
| organizationId | GUID | The organization |
| userId | GUID | The user |
| role | enum | Owner, Admin, or Member |
| assignedLicenseId | GUID? | License assigned to this member |
| joinedAt | datetime | When the user joined |

### Invitation

| Field | Type | Description |
|-------|------|-------------|
| id | GUID | Primary key |
| organizationId | GUID | Target organization |
| email | string (256) | Invitee's email |
| role | enum | Role to assign on acceptance |
| token | string (100) | Unique token for accepting |
| expiresAt | datetime | Invitation expiry (7 days) |
| invitedByUserId | GUID? | Who sent the invitation |

---

## Background Services

### License Auto-Renewal

A `BackgroundService` runs every **60 seconds** and checks for licenses that:
- Are **active** (`isActive = true`)
- Have **auto-renewal enabled** (`autoRenewal = true`)
- Have **expired** (`expiresAt <= now`)

For each matching license, it extends the expiration by the configured duration (default: **10 minutes**, configurable via the admin settings endpoint).

This means licenses with auto-renewal will never truly expire -- they'll keep getting extended as long as auto-renewal is on and the license hasn't been revoked.

---

## Email System

When an invitation is created, the system sends a styled HTML email to the invitee containing:

- A prominent **"Accept Invitation"** button (one-click link)
- A **direct URL** the user can copy/paste
- The raw **invitation token** for manual API calls
- Automatic expiry notice (7 days)

### SMTP Configuration

Add email settings to `appsettings.json`:

```json
"EmailSettings": {
  "SmtpHost": "smtp.gmail.com",
  "SmtpPort": 587,
  "SenderEmail": "your-email@gmail.com",
  "SenderPassword": "your-app-password",
  "SenderName": "OrgLicenseManager",
  "BaseUrl": "http://localhost:5228"
}
```

### Gmail Setup

1. Enable **2-Factor Authentication** on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Use the 16-character password as `SenderPassword`

### Supported Providers

| Provider | SmtpHost | SmtpPort |
|----------|----------|----------|
| Gmail | smtp.gmail.com | 587 |
| Outlook | smtp.office365.com | 587 |
| SendGrid | smtp.sendgrid.net | 587 |
| Mailgun | smtp.mailgun.org | 587 |

> If email is not configured, swap `SmtpEmailService` for `MockEmailService` in `Program.cs` -- it logs invitation details to the console instead of sending emails.

---

## Error Handling

All errors are returned in [RFC 7807 ProblemDetails](https://tools.ietf.org/html/rfc7807) format:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Organization with ID 123 does not exist"
}
```

| Status | Exception Class | When |
|--------|----------------|------|
| 400 | `BadRequestException` | Validation failures, invalid input |
| 401 | `UnauthorizedException` | Missing or invalid JWT token |
| 403 | `ForbiddenException` | Insufficient permissions for the action |
| 404 | `NotFoundException` | Resource doesn't exist |

A global exception handling middleware catches these custom exceptions and converts them to proper HTTP responses automatically.

---

## Configuration

### appsettings.json (gitignored)

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=orglicensemanager;Username=postgres;Password=password"
  },
  "JwtSettings": {
    "SecretKey": "change-this-to-a-long-random-string-at-least-32-chars",
    "Issuer": "OrgLicenseManagerAPI",
    "Audience": "OrgLicenseManagerAPIUsers",
    "ExpirationMinutes": 60
  },
  "EmailSettings": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": 587,
    "SenderEmail": "your-email@gmail.com",
    "SenderPassword": "your-app-password",
    "SenderName": "OrgLicenseManager",
    "BaseUrl": "http://localhost:5228"
  }
}
```

---

## Project Structure

```
OrgLicenseManager/
├── Controllers/              # API endpoints (thin layer)
│   ├── AuthController.cs     # Login, JWT token generation
│   ├── LicensesController.cs # Admin license CRUD
│   ├── MembershipsController.cs  # User membership & invitation acceptance
│   └── OrganizationsController.cs # Org CRUD, members, invitations, licenses
├── Services/                 # Business logic & authorization
│   ├── OrganizationService   # Org management, member/license operations
│   ├── LicenseService        # License CRUD, auto-renewal
│   ├── InvitationService     # Create/accept/cancel invitations
│   ├── MembershipService     # User's own memberships
│   ├── SmtpEmailService      # Send invitation emails via SMTP
│   ├── MockEmailService      # Console-based email mock for development
│   ├── CurrentUserService    # Extract current user from JWT claims
│   └── LicenseSettingsService # Global license expiration config
├── Entities/                 # EF Core entity models
├── Data/                     # DbContext with Fluent API configuration
├── BackgroundServices/       # License auto-renewal hosted service
├── Exceptions/               # Custom exception classes (400/401/403/404)
├── Extensions/               # Service registration, auth, Swagger, DB setup
├── Middleware/               # Global exception handling middleware
├── Migrations/               # EF Core migrations
└── Properties/               # Launch settings

OrgLicenseManager.Contracts/  # Request/Response DTOs (separate project)
├── Auth/                     # LoginRequest, LoginResponse, ClaimsResponse
├── Organizations/            # Create/Update org requests, org responses
├── Members/                  # UpdateMemberRole request, MemberResponse
├── Licenses/                 # License CRUD requests, LicenseResponse
├── Invitations/              # Create/Accept invitation DTOs
└── Common/                   # PaginationRequest, PagedResult<T>
```

---

## Example Workflow: End-to-End

```bash
# 1. Admin logs in
POST /api/auth/login
{"userId": "admin-1", "email": "admin@platform.com", "role": "Admin"}
# Save the token

# 2. A user logs in and creates an organization
POST /api/auth/login
{"userId": "alice-1", "email": "alice@acme.com", "role": "User"}

POST /api/organizations
{"name": "Acme Corp", "description": "Rocket-powered everything"}
# Alice is now the Owner of Acme Corp

# 3. Admin creates a license for Acme Corp
POST /api/admin/licenses/organizations/{orgId}
{"autoRenewal": true}

# 4. Alice invites Bob (sends him an email)
POST /api/organizations/{orgId}/invite
{"email": "bob@acme.com", "role": "Member"}

# 5. Bob logs in and accepts the invitation
POST /api/auth/login
{"userId": "bob-1", "email": "bob@acme.com", "role": "User"}

POST /api/memberships/invitations/accept
{"token": "token-from-bobs-email"}

# 6. Alice assigns the license to Bob
POST /api/organizations/{orgId}/users/{bobUserId}/license
{"licenseId": "license-guid"}

# 7. Alice promotes Bob to Admin
PUT /api/organizations/{orgId}/users/{bobUserId}/role
{"role": "Admin"}

# 8. The license auto-renews every 10 minutes (background job)
# No action needed -- it just works.
```

---

## Development Commands

```bash
# Build
dotnet build OrgLicenseManager/OrgLicenseManager.sln

# Run
dotnet run --project OrgLicenseManager

# Create a new migration
dotnet ef migrations add <MigrationName> --project OrgLicenseManager

# Apply migrations
dotnet ef database update --project OrgLicenseManager
```
