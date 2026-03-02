# MongoDB Atlas Setup Guide (Fresh Start)

Follow these steps exactly to create a new database connection that works.

## Phase 1: Create the Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and Sign In/Register.
2. Click **+ Create** button to create a deployment.
3. Select **M0 (Free)** tier.
4. Choose a provider (AWS) and a region close to you (e.g., N. Virginia `us-east-1` or Mumbai `ap-south-1`).
5. Name the cluster `GetPlacedCluster`.
6. Click **Create**.

## Phase 2: Create a Database User

1. Go to **Database Access** under the "Security" tab on the left sidebar.
2. Click **+ Add New Database User**.
3. **Authentication Method**: Password.
4. **Username**: `getplaced_admin`
5. **Password**: `GetPlaced2026!` (Strong, no special chars that break URLs like `@` or `/`).
6. **Database User Privileges**: "Read and write to any database".
7. Click **Add User**.

## Phase 3: Whitelist Network Access (CRITICAL)

_Most connection errors happen here._

1. Go to **Network Access** under the "Security" tab.
2. Click **+ Add IP Address**.
3. Click the button **Allow Access From Anywhere** (Adds `0.0.0.0/0`).
   - _Note: For production, you restrict this. For development, this ensures you can connect from home/cafe/etc._
4. Click **Confirm**.

## Phase 4: Get the Connection String

1. Go back to **Database** tab (Deployment).
2. Click **Connect** on your cluster card.
3. Select **Drivers**.
4. Choose **Node.js** (Version 5.5 or later).
5. You will see a string like:
   `mongodb+srv://getplaced_admin:<db_password>@getplacedcluster.abcde.mongodb.net/?retryWrites=true&w=majority&appName=GetPlacedCluster`
6. Copy this string.

## Phase 5: Update Your Project

1. Open your `.env` file in the `web/` directory.
2. Paste the copied string into `MONGODB_URI`.
3. Replace `<db_password>` with `GetPlaced2026!`.
   - **Final format should look like:**
     `MONGODB_URI="mongodb+srv://getplaced_admin:GetPlaced2026!@getplacedcluster.abcde.mongodb.net/?retryWrites=true&w=majority"`

## Phase 6: Verify

After updating the `.env` file:

1. Restart your developer server (`npm run dev`).
2. Try to log in or refresh the dashboard.
