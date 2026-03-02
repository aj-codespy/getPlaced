# How to Verify Resume Data in Firebase

Follow these steps to confirm that resumes are being saved correctly in your Firestore database.

## Method 1: Using the Firebase Console (Visual Way)

1.  **Log in to Firebase Console:**

    - Go to [console.firebase.google.com](https://console.firebase.google.com/).
    - Select your project: **getplaced** (or `getplaced-c313b`).

2.  **Navigate to Firestore:**

    - In the left sidebar, click on **Build** > **Firestore Database**.

3.  **Check the `resumes` Collection:**

    - You should see a "Data" tab showing your collections.
    - Look for a collection named **`resumes`**.
    - Click on it. You should see a list of Document IDs (random strings like `7d9f...`).

4.  **Inspect a Document:**
    - Click on the most recent Document ID (you can sort via usage or just check the last one).
    - Look at the fields on the right side. You should see:
      - `userId`: Your email address.
      - `targetRole`: The role you entered (or "General").
      - `content`: A map/object containing `personalInfo`, `experience`, `education`, etc.
      - `templateId`: Should be "classic" (or whatever you selected).

## Method 2: Using a Test Script (Developer Way)

I have created a script called `verify-resume-save.mjs` in your project root.

1.  **Run the script:**

    ```bash
    node verify-resume-save.mjs
    ```

    _(Note: You must have at least one resume created for this to find anything)_

2.  **What it does:**
    - It connects to your Firestore.
    - It fetches the last 5 documents from the `resumes` collection.
    - It prints out the ID, Title, and User Email for each found resume.

---

### Troubleshooting

- **Collection Missing?** If you don't see `resumes`, it means no successful API call has been made yet. Navigate to your app dashboard and click "Create New Resume" first.
- **Permission Denied?** Ensure your Firestore Rules are set to `allow read, write: if true;` (Test Mode).
