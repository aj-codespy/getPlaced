# getPlaced - AI Resume Builder

## Getting Started

1.  Navigate to the web directory:
    ```bash
    cd web
    ```
2.  Install dependencies (if not already):
    ```bash
    npm install
    ```
3.  Set up Environment Variables:
    - `.env` is already configured with a SQLite database URL and NextAuth secret.
    - **IMPORTANT**: Add your `GEMINI_API_KEY` to `.env` to enable real AI generation.
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000).

## Features

- **AI-Powered**: Uses Google Gemini to optimize resume content.
- **Premium Design**: Glassmorphism, Dark Mode, Tailwind CSS.
- **Authentication**: Built-in credential login (auto-signup for demo).
- **Database**: SQLite (via Prisma) for storing users and resumes.
- **Builder**: Multi-step form to craft your resume.

## Project Structure

- `app/`: Next.js App Router pages (Login, Dashboard, Builder).
- `components/`: Reusable UI components (Buttons, Inputs).
- `lib/`: Utilities, Database, and AI services.
- `prisma/`: Database schema.
