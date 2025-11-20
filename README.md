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
   cp .env.local.example .env.local
   ```

   Fill in your configuration in `.env.local`:
   - Firebase configuration (from Firebase Console)
   - Agora RTC credentials (from Agora Console)
   - reCAPTCHA v3 Site Key (from [Google reCAPTCHA](https://www.google.com/recaptcha/admin/create))

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

## Firebase App Check Setup

To enable Firebase App Check with reCAPTCHA v3:

1. **Get reCAPTCHA v3 credentials:**
   - Visit [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/create)
   - Select **reCAPTCHA v3**
   - Add domains: `localhost`, `omegle-vitap.web.app`, `omegle-vitap.firebaseapp.com`
   - Copy the **Site Key**

2. **Register with Firebase App Check:**
   - Go to Firebase Console → Your Project
   - Navigate to **Build** → **App Check**
   - Click **Get Started** → Select **Web** → Choose **reCAPTCHA v3**
   - Enter your Site Key and Save

3. **Add to environment variables:**

   ```bash
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_v3_site_key
   ```

4. **Add to GitHub Secrets** (for CI/CD):
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Add secret: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

## Features

- Anonymous real-time chat with video/audio
- Random user pairing with matching system
- Real-time text messaging
- Firebase App Check security
- Responsive design
- Type-safe codebase with strict TypeScript

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
