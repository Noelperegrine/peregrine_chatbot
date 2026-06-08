# Jane AI

Modern web interface for the Jane AI Agent system.

**Framework:** Next.js 16.2.6 with Turbopack  
**Port:** 3001  
**Backend:** [Peregrine Agent](../peregrine_agent)

---

## Features

- 🔐 JWT authentication with EMS database
- 💬 Real-time chat interface with AI agent
- 🎨 Modern purple gradient UI design
- ✨ AI-generated conversation titles
- 📱 Responsive design with Tailwind CSS
- 🔄 Auto-refresh for session updates
- 🎯 State management with Zustand

---

## Getting Started

First, run the development server:

```bash
npm run dev -- -p 3001
# or
bun dev -- -p 3001
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

**Note:** The backend API server must be running on port 8000.

---

## Project Structure

```
src/
├── app/              - Next.js App Router pages
│   ├── login/       - Authentication page
│   └── chat/        - Main chat interface
├── components/      - React components
│   └── ui/          - UI components (Button, Input, Card, etc.)
├── lib/             - API client and utilities
├── store/           - Zustand state stores (auth, chat)
└── types/           - TypeScript type definitions
```

---

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Tech Stack

- **Framework:** Next.js 16.2.6
- **UI:** Tailwind CSS + shadcn/ui patterns
- **State:** Zustand with persist middleware
- **HTTP:** Axios with JWT interceptors
- **Icons:** Lucide React

---

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
