# ChatConnect

A real-time anonymous chat application built with Next.js, Firebase, and TypeScript.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/
│   ├── features/          # Feature-specific components
│   ├── layout/            # Layout components (Header, Footer, etc.)
│   └── ui/                # Reusable UI components (Button, Card, etc.)
├── constants/             # App constants and configurations
├── context/               # React context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Third-party library configurations
├── services/              # API and service layer
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Firebase configuration in `.env.local`

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Firebase Realtime Database
- **Authentication:** Firebase Auth
- **Deployment:** Vercel (recommended)

## Features

- Anonymous real-time chat
- Random user pairing
- Interest-based matching
- Responsive design
- Type-safe codebase

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

