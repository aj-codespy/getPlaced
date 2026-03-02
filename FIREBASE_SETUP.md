# Firebase Setup Steps

1. **Go to Firebase Console:**

   - Visit [console.firebase.google.com](https://console.firebase.google.com/).
   - Click "Add project" and name it `get-placed`.
   - Disable Google Analytics (simpler setup) and Create.

2. **Register Web App:**

   - Click the **</>** (Web) icon on the dashboard.
   - App Nickname: `GetPlaced Web`.
   - Click **Register app**.

3. **Get Config:**

   - You will see a `const firebaseConfig = { ... }` object.
   - **COPY** the values inside it (apiKey, authDomain, projectId, etc.).
   - I will ask you for these shortly.

4. **Enable Services:**

   - **Firestore Database:**
     - Go to "Build" -> "Firestore Database".
     - Click **Create Database**.
     - Choose location (e.g., `nam5` for US or `asia-south1` for Mumbai).
     - **Rules:** Start in **Test Mode** (allow all read/write for 30 days).
   - **Authentication:**
     - Go to "Build" -> "Authentication".
     - Click **Get Started**.
     - Enable **Google** provider and/or **Email/Password**.

5. **Update .env:**
   - I will create a file for you to paste these values into.
