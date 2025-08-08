# Interviewer UI

Frontend for [Interviewer](https://interviewer.dev), an AI-powered mock backend interview platform, using real-world job-descriptions. Backend found here: https://github.com/MichaelBoegner/interviewer

## 🔧 Tech Stack

- **React** (Vite)
- **React Router** for client-side routing
- **Monaco Editor** for in-browser coding
- **PostHog** for analytics

## 🚀 Features 

- Authentication and account management (email + GitHub OAuth)
- Interactive interview interface powered by OpenAI
- Option job description ingestion for tailored interviews
- Real-time feedback, scoring, and conversation flow
- Resume/pause interview functionality
- Subscription and credit system integration
- Full dashboard of past interviews and stats 

## 🧪 Scripts

```bash
npm install       # Install dependencies
npm run dev       # Start development server
```

## 🌐 Environment Variables

You’ll need to define the following in a `.env` file:

```env
VITE_API_URL=https://api.interviewer.dev
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GITHUB_REDIRECT_URI=https://interviewer.dev/oauth-callback
```

## 📦 Deployment

Deployed via **Vercel**. 

## 📜 License

Copyright (c) 2024 Michael Boegner

This source code is proprietary. 
All rights reserved. No part of this code may be reproduced, distributed, or used 
without explicit permission from the author.

---

**Created by Michael Boegner** - [GitHub Profile](https://github.com/michaelboegner)
