# TravelSaathi - Firebase Setup and Configuration Guide

This project has been migrated from MongoDB to **Google Firebase Cloud Firestore**. This document details the step-by-step instructions to configure your Firebase project and hook it up to the application.

---

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or select an existing project).
3. Enter a project name (e.g., `travelsaathi-app`).
4. (Optional) Choose whether to enable Google Analytics, then click **Create project** and wait for it to complete.

---

## Step 2: Set up Cloud Firestore Database

1. In the Firebase console left-hand sidebar, navigate to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose your database location (select a location closest to your users) and click **Next**.
4. Start in **Test mode** (for quick local development testing) or **Production mode**:
   * **Test mode**: Allows anyone with the database reference to read/write to the database for 30 days.
   * **Production mode**: Blocks all reads/writes by default. If using Production mode, configure the security rules as shown below.
5. Click **Create** and wait for the database to provision.

### Firestore Security Rules (Recommended)

In the **Rules** tab of your Firestore Database in the console, publish the following rules to allow authenticated/basic interactions while keeping structure:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Rules for user accounts
    match /users/{userId} {
      allow read, write: if true;
    }
    
    // Rules for trips
    match /trips/{tripId} {
      allow read, write: if true;
    }
  }
}
```

---

## Step 3: Generate a Service Account Private Key

To authorize your backend Express server to talk to Firestore securely:

1. Click the gear icon (**Project settings**) at the top left of the Firebase Console.
2. Select the **Service accounts** tab.
3. Click the **Generate new private key** button at the bottom of the page.
4. Click **Generate key** to download the configuration `.json` file.
5. Move the downloaded JSON file into your local project workspace (e.g., at the root of `TravelBuddyFinder-main/`).
6. **Rename it** to something simple like `firebase-credentials.json`.
7. *Note: `.gitignore` has been updated to automatically ignore `.env` and JSON keys so they won't be pushed to GitHub.*

---

## Step 4: Configure Environment Variables

Open the `.env` file at the root of your project and configure it with your project settings:

```env
PORT=5000

# Firebase Settings
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=e:/projects/TravelBuddyFinder-main/TravelBuddyFinder-main/firebase-credentials.json

# API Keys
RANDOM_ORG_API_KEY=98abdc56-e679-4f8f-9667-5c2abfe4d401
WEATHER_API_KEY=e9522cc09ce444238ff202255240209

# JWT (backend)
JWT_SECRET=change-me-in-production
```
*Replace `your-firebase-project-id` with your actual Firebase Project ID (found in Project Settings) and supply the absolute path to your `firebase-credentials.json`.*

---

## Step 5: Start the Development Server

With Firebase credentials active:

1. Open a terminal in the root folder.
2. Ensure dependencies are installed for both frontend and backend:
   ```bash
   npm run install:all
   ```
3. Run the development environment:
   ```bash
   npm run dev
   ```
   * The backend will run on `http://localhost:5000`.
   * The frontend client will run on `http://localhost:5173`.
   * Collections (`users` and `trips`) will be automatically created on demand in your Firestore database!

---

## Troubleshooting Indexing Queries
If you query compound indexes on Firestore (e.g., getting users' own trips sorting by date), Firestore may require a composite index. 
* If this happens, your terminal console will output a direct URL warning from the Firebase SDK (e.g., `https://console.firebase.google.com/project/.../database/firestore/indexes?...`).
* Simply click that link in your browser and click **Create index** to generate the required index automatically.
