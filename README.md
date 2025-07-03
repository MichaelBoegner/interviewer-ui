# Interviewer
**An intelligent, interactive mock interview platform powered by Go, React, and PostgreSQL, designed to help users confidently prepare for Backend Engineering interviews.**

![Go Version](https://img.shields.io/badge/Go-1.20+-00ADD8?style=flat&logo=go&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)
![CI Status](https://github.com/michaelboegner/interviewer/actions/workflows/ci.yml/badge.svg)


---

## 📋 Contents

- [Overview](#-overview)
- [Learning Log](#-learning-log)
- [Recorded Demo](#-recorded-demo)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Billing & Subscription System](#billing-&-subscription-system)
- [Tech Stack](#-tech-stack)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Local Development](#-local-development)
- [Security Implementation](#-security-implementation)
- [Performance Considerations](#-performance-considerations)
- [Testing Strategy](#-testing-strategy)
- [Development Roadmap](#-development-roadmap)
- [Frontend](#-frontend)
- [License](#-license)

## 🚀 Overview

Interviewer App is a robust backend service, coupled with a light demo frontend, that powers an interactive Backend Engineer interviewing experience. It leverages ChatGPT's conversational AI capabilities to create personalized, adaptive interview sessions tailored to each user's preferences.

The application was built with a focus on:

- **Clean Architecture**: Following repository-service pattern with clear separation of concerns
- **Scalability**: Designed for horizontal scaling with stateless API design
- **Security**: Implementing industry-standard JWT authentication with refresh token rotation
- **Maintainability**: Modular code structure with reusable components

## 🧠 Learning Log

I maintain a [daily learning log](./learninglog/) as part of this project to document the challenges I face, the questions I ask, and the solutions I implement. It offers a window into how I think, debug, and grow as a backend engineer.

> 💡 If you're a hiring manager, this log is a great way to see my real-time problem-solving process and technical progression in context.

📂 [Browse the learning log →](./learninglog/)

## 🏗 System Architecture

```
┌─────────────────┐      ┌──────────────────────────────────────┐      ┌───────────────┐
│                 │      │                                      │      │               │
│     React       │◄────►│          Go Backend API              │◄────►│   PostgreSQL  │
│   Client App    │      │                                      │      │   Database    │
│                 │      │                                      │      │               │
└─────────────────┘      └───────────────┬──────────────────────┘      └───────────────┘
                                         │
                                         │
                                         ▼
                           ┌─────────────────────────┐
                           │                         │
                           │       OpenAI API        │
                           │                         │
                           └─────────────────────────┘
```

The backend is structured using a layered architecture:

- **Handler Layer**: Request validation and response formation
- **Service Layer**: Business logic encapsulation
- **Repository Layer**: Data access and persistence
- **Middleware**: Cross-cutting concerns (authentication, logging, etc.)

## 🎯 Key Features

- **User Management**: Secure user registration, authentication, and password recovery
- **JWT-based Authentication**: Access tokens with configurable expiration and refresh token rotation
- **Structured Mock Interviews**: Dynamic interview generation
- **Conversational AI Integration**: Seamless integration with OpenAI's GPT model
- **Persistent Data Storage**: Complete interview history stored for future review
- **Billing & Subscription System**: Credit-based access via Lemon Squeezy integration, supporting both one-time and recurring plans
- **RESTful API Design**: Consistent and predictable API endpoints
- **Middleware Pipeline**: Extensible middleware for request processing
- **Environment-based Configuration**: Flexible configuration for different deployment environments
- **Integration and Unit Testing**: Broad coverage utilizing Go's stdlib testing
- **Email Service**: Emails sent on key user actions using Resend.
- **Wired to Deploy to AWS**: ALB/ECS/Fargate configured and deployable for easy service switch from Fly.io in future

## 💳 Billing & Subscription System

The Interviewer platform supports both one-time purchases and recurring subscriptions using Lemon Squeezy. Credits are granted based on the user's payment plan and control access to AI-powered mock interviews.

### Credit Model
- **Individual Plan**: Buy one credit at a time. These credits never expire and persist across account changes.
- **Subscription Plans**:
  - **Pro**: 10 monthly credits
  - **Premium**: 20 monthly credits
  - Subscription credits pause when a user cancels, and reactivate upon resumption.
  - Unused credits roll over, but require an active subscription to be used.

### Webhook Integration
- Real-time Lemon Squeezy events power the billing system:
  - `subscription_created` → Assign plan tier + grant credits
  - `subscription_payment_success` → Monthly credit refresh
  - `subscription_cancelled` / `expired` → Pause credit usage
  - `subscription_resumed` → Reinstate usage of rolled-over credits
  - `order_created` → Grant one-time credit
  - `subscription_plan_changed` → Upgrading or downgrading a plan

### Guardrails
- All webhook events are idempotent via tracked `webhook_id`
- Credits are separated by type: `individual` vs `subscription`
- System enforces credit availability before allowing interview creation

## 🛠️ Tech Stack

| Component             | Technology                                       |
|-----------------------|--------------------------------------------------|
| **Backend Language**  | Go (Golang) 1.20+                                |
| **Database**          | PostgreSQL 15+                                   |
| **Authentication**    | JWT-based authentication (access & refresh tokens) |
| **AI Integration**    | OpenAI GPT API (4.0)                             |
| **Billing**           | Lemon Squeezy API                                |
| **Mailing**           | Resend API                                       |
| **Testing**           | Go table-driven tests (unit + integration)       |
| **Containerization**  | Docker                                           |
| **Deployment**        | Fly.io                                           |
| **Database Hosting**  | Supabase (PostgreSQL)                            |
| **Version Control**   | Git                                              |

## 📘 API Documentation

### Authentication Flow

```
┌─────────┐                                  ┌─────────┐                       ┌─────────┐
│         │                                  │         │                       │         │
│ Client  │                                  │ Server  │                       │ Database│
│         │                                  │         │                       │         │
└────┬────┘                                  └────┬────┘                       └────┬────┘
     │                                            │                                 │
     │ POST /api/users (Register)                 │                                 │
     │───────────────────────────────────────────►│                                 │
     │                                            │                                 │
     │                                            │ Store User                      │
     │                                            │────────────────────────────────►│
     │                                            │                                 │
     │ 201 Created                                │                                 │
     │◄───────────────────────────────────────────│                                 │
     │                                            │                                 │
     │ POST /api/auth/login                       │                                 │
     │───────────────────────────────────────────►│                                 │
     │                                            │ Verify Credentials              │
     │                                            │────────────────────────────────►│
     │                                            │                                 │
     │ 200 OK (Access Token + Refresh Token)      │                                 │
     │◄───────────────────────────────────────────│                                 │
     │                                            │                                 │
     │ Request with Access Token                  │                                 │
     │───────────────────────────────────────────►│                                 │
     │                                            │ Validate Token                  │
     │                                            │                                 │
     │ Response                                   │                                 │
     │◄───────────────────────────────────────────│                                 │
     │                                            │                                 │
     │ POST /api/auth/token (Refresh)             │                                 │
     │───────────────────────────────────────────►│                                 │
     │                                            │ Verify Refresh Token            │
     │                                            │────────────────────────────────►│
     │                                            │                                 │
     │ 200 OK (New Access Token + Refresh Token)  │                                 │
     │◄───────────────────────────────────────────│                                 │
     │                                            │                                 │
```

### API Endpoints
#### User Management
- `POST /api/users` – Register a new user
- `GET /api/users/{id}` – Get user profile
- `DELETE /api/users/delete/{id}` – Delete user account
- `POST /api/auth/check-email` – Check if an email exists
- `POST /api/auth/request-verification` – Send verification email
- `POST /api/auth/request-reset` – Request password reset email
- `POST /api/auth/reset-password` – Reset password

#### Authentication
- `POST /api/auth/login` – User login (email/password)
- `POST /api/auth/github` – GitHub OAuth login
- `POST /api/auth/token` – Refresh access token

#### Interviews
- `POST /api/interviews` – Create a new interview
- `GET /api/interviews/{id}` – Fetch a specific interview
- `PATCH /api/interviews/{id}` – Update interview status (e.g., pause/resume)

#### Conversations
- `POST /api/conversations/create/{interview_id}` – Create a new conversation for interview
- `POST /api/conversations/append/{interview_id}` – Append a response to an ongoing conversation
- `GET /api/conversations/{interview_id}` – Get full conversation history for an interview

#### Job Description
- `POST /api/jd` – Process job description input for interview tailoring

#### Billing & Payments
- `POST /api/payment/checkout` – Start a new subscription checkout session
- `POST /api/payment/cancel` – Cancel subscription
- `POST /api/payment/resume` – Resume canceled subscription
- `POST /api/payment/change-plan` – Change subscription tier
- `POST /api/webhooks/billing` – Lemon Squeezy billing webhook handler

#### Dashboard
- `GET /api/user/dashboard` – Retrieve user dashboard data

#### Health Check
- `GET /health` – Service health check

## 🗄 Database Schema

All schema definitions are managed via SQL migration files located in `/database/migrations/`.

To apply them:

`make migrate-up  # or specify your migration tool/command`

The schema includes tables for `users`, `interviews`, `conversations`, `questions`, `messages`, `refresh_tokens`, `processed_webhooks`, and `credit_transactions`. See individual migration files for full definitions.

## 📦 Deployment

### Deployment Philosophy

My current deployment approach prioritizes simplicity, cost-efficiency, and flexibility:

1. **Primary/Early deployment via Fly.io** — Ideal for rapid iteration, minimal infrastructure overhead, and a smooth path to initial user feedback. This is my default platform for going to market quickly.
2. **AWS ECS Fargate + ALB fully configured** — I’ve pre-wired an AWS deployment path using ECS, ALB, and ACM certificates. This allows me to scale seamlessly by simply pointing DNS to the ALB once traffic or organizational needs warrant it.
3. **Manual deploy for now** — To avoid accidental production pushes, I’ve chosen manual deployment. I’ll revisit full CD/staging setup as traffic/updates warrant it.


### CI Pipeline

The project uses a GitHub Actions CI workflow to enforce code quality and test reliability. Every push and pull request to the `main` branch triggers:

- **Linting** (`go vet`) to catch potential bugs
- **Integration Tests** (`make test`) against a Dockerized PostgreSQL test database
- **Environment Setup**: Test environment variables are injected securely during the workflow
- **Isolation**: No production deployment is automatically triggered to maintain staging integrity

### Deployment Stack
- **Application Hosting**: Fly.io (containerized deployment)
- **Frontend Hosting**: Vercel
- **Database**: Supabase PostgreSQL
- **Environment Variables**: Managed through Fly.io secrets
- **Future Prod**: AWS - ALB/ECS/Fargate - Deployment infra is available under `infra/aws/` and `infra/ecs/`

### Deployment Process
1. Build Docker container using the included Dockerfile
2. Push to Fly.io platform
3. Configure environment variables for production

```bash
# Deploy to Fly.io
fly launch
fly secrets set JWT_SECRET=your-secret DATABASE_URL=your-supabase-url OPENAI_API_KEY=your-api-key
fly deploy
```

## 🔧 Local Development

### Prerequisites
- Go 1.20+
- PostgreSQL 15+
- Docker (optional, for containerized development)

### Setup Instructions

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/interviewer.git
   cd interviewer
   ```

2. Install dependencies
   ```bash
   go mod download
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Create the database
   ```bash
   # Create PostgreSQL database named 'interviewerio'
   createdb interviewerio
   
   # Apply migrations
   # Either manually execute SQL files in database/migrations or use a migration tool
   ```

5. Run the application
   ```bash
   go run main.go
   ```

### Using Docker
```bash
docker build -t interviewer .
docker run -p 8080:8080 --env-file .env interviewer
```

## 🔒 Security Implementation

- **Password Hashing**: Passwords are securely hashed and never stored in plaintext
- **JWT Authentication**: Short-lived access tokens with refresh token rotation
- **Prepared Statements**: All database queries use prepared statements to prevent SQL injection
- **CORS Configuration**: Configured to restrict origins in production environments
- **Environment Variables**: Sensitive configuration stored in environment variables

## ⚡ Performance Considerations

- **Stateless Design**: The API is designed to be stateless, allowing for horizontal scaling

## ✅ Testing Strategy

The app is tested with both **unit tests** (mocked repositories) and **integration tests** (real PostgreSQL + full HTTP stack).

- **Unit Tests**: Every core domain (`user`, `token`, `interview`, `conversation`) is covered using table-driven tests and a mock repository layer. This verifies business logic independently from the database.
- **Integration Tests**: `handlers/handlers_test.go` validates full end-to-end request flows using a Dockerized PostgreSQL test database. The `Makefile` automates setup, teardown, and migration steps to simulate a production-like environment.

Tests are run consistently during development and are integrated into the CI pipeline to ensure correctness, stability, and maintainability.

## 🛣️ Development Roadmap

### Upcoming Additional Improvements
- Google auth
- Timer
- Deduplicating questions accross interviews
- Strengths/weaknesses summary
- Line graph (progress tracker)
- Interview readiness meter
- Enhancing error handling and recovery mechanisms
- Structured logging for better observability
- Implement a single active session policy
- Supporting multiple conversation tracks within an interview
- Adding detailed analytics for interview performance
- Optimizing database queries
- Interview preferences (language, difficulty, duration, etc . . .)

## 🌐 Frontend

The frontend is built in React and communicates with the protected backend API. It handles:

- Authentication (login, signup, token refresh)
- Interview start and in-progress flow
- GPT-4 feedback and response display
- Post-interview summary (upcoming)

The frontend is currently deployed on Vercel and connects to a deployed Fly.io backend


## 📜 License

Copyright (c) 2024 Michael Boegner

This source code is proprietary. 
All rights reserved. No part of this code may be reproduced, distributed, or used 
without explicit permission from the author.

---

**Created by Michael Boegner** - [GitHub Profile](https://github.com/michaelboegner)

