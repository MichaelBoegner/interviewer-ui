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

*For a deep dive into the challenges, design decisions, and lessons learned, check out my retrospective:*  
**[Interviewer App: Lessons from Building an AI-Powered Mock Interview Platform](https://medium.com/@michaelboegner/my-experience-developing-the-mock-interview-app-interviewer-7dfc42f82ee4)**  

The application was built with a focus on:

- **Clean Architecture**: Following repository-service pattern with clear separation of concerns
- **Scalability**: Designed for horizontal scaling with stateless API design
- **Security**: Implementing industry-standard JWT authentication with refresh token rotation
- **Maintainability**: Modular code structure with reusable components

> ⚠️ **Note:** The backend code for this project is private due to proprietary licensing and upcoming go-to-market efforts. I built the entire backend myself in Go, including structured interview logic, OpenAI GPT-4 integration, secure JWT-based auth, and PostgreSQL-backed persistence.
>
> This README remains public to demonstrate the full system design, development process, and architecture. The [frontend repository](https://github.com/michaelboegner/interviewer-ui) reflects the user experience side of the platform.

## 🧠 Learning Log

I maintain a [daily learning log](./learninglog/) as part of this project to document the challenges I face, the questions I ask, and the solutions I implement. It offers a window into how I think, debug, and grow as a backend engineer.

> 💡 If you're a hiring manager, this log is a great way to see my real-time problem-solving process and technical progression in context.

📂 [Browse the learning log →](./learninglog/)

## 🎥 Recorded Demo
- Due to the costs involved with calls to OpenAI, I have opted to provide a recorded demo in lieue of open access.
- While there’s plenty of room to expand the frontend — such as adding topic listings, dashboards, and user account features — this project is primarily focused on backend engineering. My goal was to design and implement a clean, well-structured backend system with real-world patterns like service layering, token authentication, and integration with external APIs.
- Live demonstrations are available upon request. 
- [Watch the video](https://www.loom.com/share/df1cd256e2254650b0691af254747fb9?sid=0407a578-961e-4580-8425-f3066b6d183c)
[![Watch the video](assets/loom-preview.png)](https://www.loom.com/share/df1cd256e2254650b0691af254747fb9?sid=0407a578-961e-4580-8425-f3066b6d183c)

## 🏗 System Architecture

```
┌─────────────────┐      ┌──────────────────────────────────────┐      ┌───────────────┐
│                 │      │                                      │      │               │
│   Client App    │◄────►│   Go Backend API (This Repository)   │◄────►│   PostgreSQL  │
│   (React.js)    │      │                                      │      │   Database    │
│                 │      │                                      │      │               │
└─────────────────┘      └───────────────┬──────────────────────┘      └───────────────┘
                                         │
                                         │
                                         ▼
                           ┌─────────────────────────┐
                           │                         │
                           │   OpenAI API (ChatGPT)  │
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
- **RESTful API Design**: Consistent and predictable API endpoints
- **Middleware Pipeline**: Extensible middleware for request processing
- **Environment-based Configuration**: Flexible configuration for different deployment environments
- **Integration and Unit Testing**: Broad coverage utilizing Go's stdlib testing
- **Wired to Deploy to AWS**: ALB/ECS/Fargate configured and deployable for easy service switch from Fly.io in future

## 🛠️ Tech Stack

| Component             | Technology                                       |
|-----------------------|--------------------------------------------------|
| **Backend Language**  | Go (Golang) 1.20+                               |
| **Database**          | PostgreSQL 15+                                   |
| **Authentication**    | JWT-based authentication (access & refresh tokens) |
| **AI Integration**    | OpenAI GPT API (4.0)                             |
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
- `POST /api/users` - Register a new user
- `GET /api/users/{id}` - Get user profile

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/token` - Refresh access token

#### Interviews
- `POST /api/interviews` - Create a new interview

#### Conversations
- `POST /api/conversations/create` - Create a new conversation
- `POST /api/conversations/append` - Append an existing conversation

## 🗄 Database Schema

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     users       │       │    interviews    │       │  conversations   │
├─────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id              │       │ id               │       │ id               │
│ username        │       │ user_id          │◄──────┤ interview_id     │
│ email           │       │ length           │       │ current_topic    │
│ password        │       │ number_questions │       │ current_subtopic │
│ created_at      │       │ difficulty       │       │ current_question │
│ updated_at      │       │ status           │       │ created_at       │
└────────┬────────┘       │ score            │       │ updated_at       │
         │                │ language         │       └────────┬─────────┘
         │                │ prompt           │                │
         │                │ first_question   │                │
         │                │ subtopic         │                │
         │                │ created_at       │                │
         │                │ updated_at       │                │
         │                └──────────────────┘                │
         │                                                    │
         │                                                    │
┌────────▼────────┐       ┌──────────────────┐       ┌────────▼─────────┐
│ refresh_tokens  │       │     messages     │       │    questions     │
├─────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id              │       │ id               │       │ id               │
│ user_id         │       │ conversation_id  │◄──────┤ conversation_id  │
│ refresh_token   │       │ topic_id         │       │ topic_id         │
│ expires_at      │       │ question_number  │       │ question_number  │
│ created_at      │       │ author           │       │ prompt           │
│ updated_at      │       │ content          │       │ created_at       │
│ updated_at      │       │ created_at       │       └──────────────────┘
└─────────────────┘       └──────────────────┘       
                                                     
```

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

### Current Focus
#### GTM steps: 
- Payment integration  
- Ensure interview recovery on reloads/failures
- Dashboard of interviews and results
- User analytics
- Subscription levels rate limiting
- Marketing landing page
- Basic user security protocols  
- Marketing for launch
- Github login


### Upcoming Additional Improvements
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

