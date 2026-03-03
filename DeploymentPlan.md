# Application Deployment Plan

This document outlines the exact deployment strategy, infrastructure requirements, and environmental configuration needed to push the application from local development to production.

## System Architecture

The project consists of two distinct components that must be deployed separately:

1. **Frontend / Web API (`web/`):** A Next.js (App Router) application handling the user interface, authentication, payments, and database logic.
2. **Python Optimization & Generation Service (`python-service/`):** A FastAPI server running AI Optimization (LangGraph/Gemini) and executing system-level PDF generation using LaTeX.

---

## 1. Environment Variables & API Requirements

You must define these secrets in your production environments.

### Vercel / Next.js Environment (`web/` `.env.production`)

- **Firebase (Database & Storage)**
  - `NEXT_PUBLIC_FIREBASE_API_KEY`: Found in Firebase Console
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Example: `getplaced-c313b.firebaseapp.com`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Example: `getplaced-c313b`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: `getplaced-c313b.firebasestorage.app`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
- **Authentication (NextAuth)**
  - `NEXTAUTH_SECRET`: A secure randomly generated string for JWT encryption. (Run `openssl rand -base64 32` to generate one).
  - `NEXTAUTH_URL`: Your production domain (e.g., `https://www.yourdomain.com`).
  - `GOOGLE_CLIENT_ID`: Your Google OAuth Production Client ID.
  - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Production Secret.
- **Payment Gateway (Razorpay)**
  - `RAZORPAY_KEY_ID`: Your live Razorpay ID.
  - `RAZORPAY_KEY_SECRET`: Your live Razorpay Secret.
- **AI & External Services**
  - `GEMINI_API_KEY`: Required for inline optimizers and audits (Using Gemini 2.5 Flash).
  - `PYTHON_SERVICE_URL`: The production URL where your Python FastAPI server is hosted (e.g., `https://api.yourdomain.com`).

### Python API Environment (`python-service/` `.env`)

- **AI Configuration**
  - `GEMINI_API_KEY`: Required for the LangGraph-based ATS Rewrite logic.

---

## 2. Deploying the Python Service (Backend)

Because this service relies heavily on `pdflatex` to compile PDFs, standard serverless hosts (like Vercel or AWS Lambda) **will not work** due to missing system packages. It must run in a container or a dedicated VPS.

**Recommended Platform:** Render (Web Service), Railway, or DigitalOcean App Platform.

### Deployment Steps:

1. **Dockerfile Requirement:** You must use a Dockerfile to deploy this so you can install LaTeX. A basic Dockerfile in the `python-service/` folder would look like this:

   ```dockerfile
   FROM python:3.11-slim

   # Install System Dependencies (Crucial for PDF generation)
   RUN apt-get update && apt-get install -y \
       texlive-latex-base \
       texlive-latex-extra \
       texlive-fonts-recommended \
       && rm -rf /var/lib/apt/lists/*

   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   COPY . .

   # Start FastAPI
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Expose Ports:** Ensure port `8000` is mapped publicly.
3. **Environment:** Attach the `GEMINI_API_KEY` to this deployment.

---

## 3. Deploying the Next.js Web App (Frontend)

The frontend is specifically optimized for Edge and Serverless deployment.

**Recommended Platform:** Vercel (ideal for Next.js) or AWS Amplify.

### Deployment Steps:

1. Link your GitHub repository directly to Vercel.
2. Ensure the "Root Directory" in Vercel settings is pointed to `/web`.
3. Enter all specific Environment Variables defined in Section 1 into the Vercel dashboard.
   _(Crucial: Make sure `PYTHON_SERVICE_URL` points to the hosted URL from Step 2)_.
4. Deploy the application.

---

## 4. Domain & DNS Configuration (Optional but Recommended)

For a fully professional setup, you only need one core domain.

1. **Purchase Domain:** (e.g., `getplaced.in` or `jobresume.com`)
2. **Setup Subdomains via DNS (A/CNAME records):**
   - Route `www.yourdomain.com` and `yourdomain.com` directly to Vercel.
   - Map a subdomain like `api.yourdomain.com` to your Python Render/DigitalOcean server instance.
3. **OAuth Setup:** Ensure `https://yourdomain.com/api/auth/callback/google` is added to your authorised redirect URIs in the Google Cloud Console.
4. **Firebase Configuration:** Add `yourdomain.com` to the authorised domains inside Firebase Authentication settings to allow Google Sign-ins.

---

## 5. Pre-Flight Checklist

Before pushing to live users, verify the following:

- [ ] Users can log in using Google OAuth on the real domain.
- [ ] Razorpay transactions route efficiently through live API keys (turning off test mode).
- [ ] The Admin Dashboard successfully extracts metrics using the new production inputs.
- [ ] The visual PDF builder (`web/`) can successfully ping the hosted FastAPI engine (`PYTHON_SERVICE_URL`), generate the ATS parameters via Gemini 2.5, and stream the generated `pdf_bytes` seamlessly without timing out.

---

## 6. Smart Cost Optimisation Strategy (Built-In)

We have explicitly engineered the architecture to prevent uncontrollable cost spillage.

### Rule 1 — Sleep Server When Idle

- **How it works:** Because `python-service` generation is handled statically and stateless, deploying on host services like **Render (Free/Starter)** or **Railway** allows the container to safely "spin down" to zero after 15 minutes of inactivity. This will drastically reduce memory/CPU uptime charges. When a user requests a PDF, the container spins back up.

### Rule 2 — Smart Generation Limits

- **How it works:** We explicitly halt unbounded CPU drain on your LaTeX compiler. The `api/resume/download/route.ts` API now actively parses user plan statuses.
- **Limits Built-In:** Free/Basic users are explicitly throttled at **3 PDF Generations per day** at the codebase level. Premium users bypass this limit.

### Rule 3 — Intelligent PDF Caching

- **How it works:** To prevent redundant and costly recompilations of the exact same resume, the app actively creates a SHA-256 hash of the requested LaTeX payload.
- **Huge Savings:** This hash acts as a unique ID inside a new Firebase `pdf_cache` collection. If a user tries to rebuild the exact same data under the same template, we bypass the AI and Python server entirely, instantly streaming the encoded Base64 PDF directly out of Firestore cache.
