# Application Deployment Plan

This document outlines the exact deployment strategy, infrastructure requirements, and environmental configuration needed to push the application from local development to production _specifically_ using **Google Cloud Run** (for the Python Service) and **Vercel** (for the Next.js Frontend).

All current code resides on the GitHub `main` branch.

## System Architecture

The project consists of two distinct components that must be deployed separately:

1. **Frontend / Web API (`web/`):** A Next.js application handling the user interface, authentication, payments, and Firebase logic. (Deploying to Vercel).
2. **Python Optimization & Generation Service (`python-service/`):** A FastAPI server running AI Optimization (LangGraph/Gemini 2.5 Flash) and executing system-level PDF generation using LaTeX. (Deploying to Google Cloud Run).

---

## 1. Deploying the Python Service (Backend) to Google Cloud Run

This is a complete start-to-finish guide to deploy the FastAPI + LaTeX Docker backend properly, cleanly, and production-ready to Google Cloud Run, assuming:

- We want pay-per-use (scale-to-zero)
- We're in India → using `asia-south1` (Mumbai region)

### Deployment Steps (Google Cloud Run):

#### Step 1: Create Google Cloud Project

1. Go to: [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click **New Project**, name it `resume-backend`, and click **Create**.
3. Select this project from the top bar project selector.

#### Step 2: Enable Required APIs

Go to **APIs & Services → Library** and enable:

- Cloud Run API
- Artifact Registry API
- Cloud Build API
- IAM Service Account Credentials API

#### Step 3: Install Google Cloud CLI (Local Machine)

**Mac:**

```bash
brew install --cask google-cloud-sdk
```

Login and set project:

```bash
gcloud auth login
gcloud config set project resume-backend
```

#### Step 4: Create Docker Artifact Registry

Create a place to store your image:

```bash
gcloud artifacts repositories create resume-repo \
  --repository-format=docker \
  --location=asia-south1 \
  --description="Resume API Docker repo"
```

#### Step 5: Authenticate Docker With GCP

```bash
gcloud auth configure-docker asia-south1-docker.pkg.dev
```

#### Step 6: Verify Dockerfile

Ensure your `Dockerfile` inside `python-service/` exposes port 8080 (Cloud Run requires 8080):

```dockerfile
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

#### Step 7: Build Docker Image

From inside the `python-service/` directory:

```bash
docker build -t asia-south1-docker.pkg.dev/resume-backend/resume-repo/resume-api .
```

#### Step 8: Push Image To Google

```bash
docker push asia-south1-docker.pkg.dev/resume-backend/resume-repo/resume-api
```

#### Step 9: Deploy to Cloud Run

```bash
gcloud run deploy resume-api \
  --image asia-south1-docker.pkg.dev/resume-backend/resume-repo/resume-api \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 1 \
  --max-instances 3
```

After success, you’ll receive a Service URL (e.g., `https://resume-api-xxxxx.a.run.app`).

#### Step 10: Set Environment Variables

1. Go to Cloud Run → resume-api → Edit & Deploy New Revision.
2. Add your environment variables like `GEMINI_API_KEY`.
3. Deploy new revision.

#### Step 11: Cost Protection Settings

1. Go to **Container → Scaling**.
2. Ensure: Minimum instances = 0, Maximum instances = 3, CPU allocated only during request.

---

## 2. Deploying the Next.js Web App (Frontend) to Vercel

The frontend is specifically optimized for Edge and Serverless deployment on Vercel.

### Constraints & Considerations for Vercel:

- **Timeouts:** Free Vercel functions time out after 10-15 seconds. Pro times out after 60s. The Python PDF compilation + Gemini rewriting takes about 4–10 seconds.
- **Environment Variables:** All third-party secrets must be explicitly defined here.

### Deployment Steps (Vercel):

1. **Connect GitHub to Vercel:**
   - Go to the Vercel Dashboard -> Add New -> Project.
   - Import the `getPlaced` repository from GitHub.

2. **Configure Project Settings:**
   - **Root Directory:** Set this to `web/` instead of the root folder.
   - **Framework Preset:** Vercel should automatically detect `Next.js`.

3. **Set Environment Variables:**
   Before clicking "Deploy", add the following live API keys:
   - **Python Core Connection:**
     - `PYTHON_SERVICE_URL` -> Exactly the Cloud Run URL from step 1.9 (e.g., `https://resume-api-xxxxx.a.run.app/generate-pdf`)
   - **Firebase Rules (Database & Cache)**
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - **Authentication (NextAuth)**
     - `NEXTAUTH_SECRET` -> Generate a secure string (Run `openssl rand -base64 32`).
     - `NEXTAUTH_URL` -> Vercel will give you a domain. You can add it here later, or use your custom domain (e.g., `https://www.yourdomain.com`).
     - `GOOGLE_CLIENT_ID` -> Your Google OAuth Production Client ID.
     - `GOOGLE_CLIENT_SECRET` -> Your Google OAuth Production Secret.
   - **Payments (Razorpay Live Mode)**
     - `RAZORPAY_KEY_ID` -> Live Key ID from the Razorpay Dashboard.
     - `RAZORPAY_KEY_SECRET` -> Live Key Secret.
   - **Inline AI Modules (Frontend Gemini)**
     - `GEMINI_API_KEY` -> The key used for inline optimizers on the frontend (Gemini 2.5 Flash).

4. **Deploy:**
   Click **Deploy**. Vercel will build the `web/` folder seamlessly.

---

## 3. Post-Deployment Administrative Configuration

Once both systems are live, you have three strict administrative steps to complete outside of code.

### A. Google OAuth Configuration

1. Go to Google Cloud Console -> APIs & Services -> Credentials.
2. Edit your OAuth 2.0 Web Client.
3. Add your Vercel/Custom live domain to **Authorized JavaScript origins** (e.g. `https://yourdomain.com`).
4. Add your Vercel/Custom live domain NextAuth callback to **Authorized redirect URIs** (e.g. `https://yourdomain.com/api/auth/callback/google`).

### B. Firebase Authentication Constraints

1. Go to Firebase Console -> Authentication -> Settings -> Authorized Domains.
2. Add your live Vercel domain or custom domain. If you do not do this, Google Logins will fail with `auth/unauthorized-domain`.

### C. Smart Cost Optimisation Verification

We have explicitly engineered the backend with a rate limiting protocol. Once live:

- Create a test user "free" account on the live link.
- Attempt to generate >3 PDFs. The Next.js frontend should block the 4th request.
- Observe the Cloud Run dashboard. The instances should automatically scale to zero when idle, verifying cost protection.

---

## Master Deployment Checklist

- [x] Code pushed to GitHub `main` branch.
- [ ] Google Cloud CLI installed locally (`brew install --cask google-cloud-sdk`).
- [ ] GCP project `resume-backend` created and APIs enabled.
- [ ] Docker authenticated with Artifact Registry.
- [ ] Docker Image built and pushed to `asia-south1-docker.pkg.dev`.
- [ ] Deployed to Cloud Run with `max-instances=3` and port 8080.
- [ ] Cloud Run Environment Variables injected (`GEMINI_API_KEY`).
- [ ] Vercel linked to GitHub repository (`web/` root).
- [ ] Vercel Environment variables populated (including `PYTHON_SERVICE_URL`).
- [ ] Google Cloud Console OAuth redirect links updated.
- [ ] Firebase Authorized Domains appended.
- [ ] Razorpay mode transitioned to Live.

---

## 4. Connecting Your GoDaddy Custom Domain to Vercel

Once your Vercel app is deployed (it will have a `.vercel.app` URL initially), follow these exact steps to connect your GoDaddy domain (e.g., `yourdomain.in`).

### Step 1: Add the Domain in Vercel

1. Go to your Vercel Dashboard and click on your project.
2. Go to **Settings** → **Domains**.
3. Type in your custom domain (e.g., `getplaced.in`) and click **Add**.
4. Choose the recommended option to add both `getplaced.in` and `www.getplaced.in` (redirecting one to the other).
5. Vercel will now show an "Invalid Configuration" error message with specific DNS records you need to add (usually an `A` record and a `CNAME` record). Keep this page open.

### Step 2: Configure GoDaddy DNS

1. Log into your GoDaddy account.
2. Go to **My Products** → click **DNS** next to your domain.
3. You need to add/edit the records exactly as Vercel instructed:

**Record 1 (For the root domain `getplaced.in`):**

- **Type**: `A`
- **Name**: `@`
- **Value**: `76.76.21.21` (Verify this IP on Vercel's page)
- **TTL**: Custom (600 seconds) or Default

**Record 2 (For the `www` subdomain `www.getplaced.in`):**

- **Type**: `CNAME`
- **Name**: `www`
- **Value**: `cname.vercel-dns.com.`
- **TTL**: Custom (1 Hour) or Default

_(Note: Delete any existing "Parked" A records or conflicting CNAME records GoDaddy might have put there by default)._

### Step 3: Wait for Propagation

1. Go back to your Vercel Domains settings.
2. The domain cards will briefly show "Pending Verification".
3. Wait 5-15 minutes. Once the DNS propagates, Vercel will automatically generate a free SSL certificate, and the status will turn to a **Blue Checkmark (Valid)**.
4. Your custom domain is now live!

_(Crucial: Now that you have your custom domain, make sure you update the `NEXTAUTH_URL` environment variable in Vercel to `https://getplaced.in`, and update your Google OAuth Redirect URIs!)_

---

## 5. Setting Up Google Analytics (GA4)

All the tracking code is already injected into the application layout. You just need to create the ID and add it as an environment variable.

### Step 1: Create the Property

1. Go to [analytics.google.com](https://analytics.google.com/).
2. Log in with your Google account. Click **Admin** (gear icon bottom left).
3. Click **Create Property**.
4. Name it `getPlaced`, select your timezone (India) and currency (INR). Click Next and complete the business details.
5. Choose **Choose a platform** → **Web**.
6. Enter your new custom website URL (e.g., `https://getplaced.in`) and Stream Name (`getPlaced Web`).
7. Ensure **Enhanced measurement** is toggled ON (this tracks scrolls, clicks, etc.).
8. Click **Create stream**.

### Step 2: Get Your Measurement ID

1. On the Web stream details page that pops up, look at the top right.
2. You will see a **Measurement ID** starting with "G-" (e.g., `G-1A2B3C4D5E`). Copy this exact ID.

### Step 3: Add to Vercel

1. Go to your Vercel Dashboard → Project → **Settings** → **Environment Variables**.
2. Key: `NEXT_PUBLIC_GA_ID`
3. Value: `G-1A2B3C4D5E` (Paste your copied ID)
4. Environments: Check **Production**.
5. Click **Save**.

### Step 4: Trigger a Re-deploy

Environment variables only apply on a fresh build.

1. In Vercel, go to the **Deployments** tab.
2. Click the three dots `...` next to your most recent production deployment.
3. Click **Redeploy**.
4. Once the build finishes (about 1 minute), your site is officially being tracked by Google Analytics.
