# PixSort — Complete Setup, Configuration & Deployment Guide

This guide walks through every step required to configure, run locally, connect personal Google Drive accounts, set up Firebase & Cloud Firestore, and deploy PixSort to production.

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1: Clone & Install Dependencies](#3-step-1-clone--install-dependencies)
4. [Step 2: Google Gemini AI API Key](#4-step-2-google-gemini-ai-api-key)
5. [Step 3: Firebase Project Setup](#5-step-3-firebase-project-setup)
6. [Step 4: Enable Google Drive API](#6-step-4-enable-google-drive-api)
7. [Step 5: Cloud Firestore Database Setup & Security Rules](#7-step-5-cloud-firestore-database-setup--security-rules)
8. [Step 6: Firebase Authentication Setup](#8-step-6-firebase-authentication-setup)
9. [Step 7: Local Development Server](#9-step-7-local-development-server)
10. [Step 8: Connecting Personal Google Drive Storage](#10-step-8-connecting-personal-google-drive-storage)
11. [Step 9: Production Build & Deployment](#11-step-9-production-build--deployment)
12. [Troubleshooting & FAQs](#12-troubleshooting--faqs)

---

## 1. Architecture Overview

PixSort is a modern personal photo management and multimodal semantic search system built on Google Cloud services:
- **Vision & Scene Intelligence**: Google Gemini 2.5 Flash (`gemini-2.5-flash`)
- **Semantic Embeddings & Vector Math**: Gemini Embedding 2 (`gemini-embedding-2-preview`) & Vertex AI vector search principles
- **Decentralized Storage**: Google Drive API v3 (pooled across personal Google accounts with dynamic capacity failover)
- **Centralized Metadata & Sync**: Google Cloud Firestore NoSQL
- **Frontend**: React 19 + TypeScript + Tailwind CSS (Clay Neomorphic `#EEF2F6` theme)
- **Backend Server**: Node.js + Express bound to `0.0.0.0:3000`

---

## 2. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Git**
- A **Google Account** (to access Google Cloud Console and Firebase)

---

## 3. Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/Om-Prakash-Verma/PixSort.git
cd PixSort
npm install
```

---

## 4. Step 2: Google Gemini AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API Key**.
3. Create a `.env` file in the root directory (copy from `.env.example` if available) and add your key:

```env
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
PORT=3000
```

---

## 5. Step 3: Firebase Project Setup

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or select your existing project e.g. `pixsort-62b7b`).
3. Follow the prompts to create the project.
4. Go to **Project Settings** (gear icon next to Project Overview).
5. Under **Your apps**, click the **Web** icon (`</>`) to register a web application.
6. Copy the `firebaseConfig` object and ensure your `firebase-applet-config.json` in the project root matches:

```json
{
  "projectId": "pixsort-62b7b",
  "appId": "1:68321745770:web:f350b09f67091736896313",
  "apiKey": "AIzaSyBgGBtqJl4mlGxgQAttCRBW7-YuiUAWKlA",
  "authDomain": "pixsort-62b7b.firebaseapp.com",
  "storageBucket": "pixsort-62b7b.firebasestorage.app",
  "messagingSenderId": "68321745770",
  "measurementId": "G-KCRW0YE0LX",
  "firestoreDatabaseId": "(default)",
  "oAuthClientId": ""
}
```

---

## 6. Step 4: Enable Google Drive API

For PixSort to store and retrieve photos directly inside Google Drive:

1. Visit the Google Cloud Console API Library for your project:
   👉 **[Enable Google Drive API](https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=68321745770)**
   *(Replace `68321745770` with your Google Cloud Project Number if using another project).*
2. Click the blue **ENABLE** button.

---

## 7. Step 5: Cloud Firestore Database Setup & Security Rules

### Create Database
1. In the [Firebase Console](https://console.firebase.google.com/project/pixsort-62b7b/firestore), select **Firestore Database**.
2. Click **Create database**.
3. Choose a cloud location nearest to you (e.g. `asia-south1` or `nam5 (us-central)`).
4. Select **Start in test mode** and click **Create**.

### Publish Security Rules
Go to the **Rules** tab in Firestore and paste the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Check if user is logged in
    function isAuthenticated() {
      return request.auth != null;
    }

    // Photos Collection
    match /photos/{photoId} {
      allow read, write: if true;
    }

    // Albums Collection
    match /albums/{albumId} {
      allow read, write: if true;
    }

    // Connected Google Drive Accounts
    match /drive_accounts/{accountId} {
      allow read, write: if true;
    }

    // Users Collection
    match /users/{userId} {
      allow read, write: if true;
    }
  }
}
```
Click **Publish**.

---

## 8. Step 6: Firebase Authentication Setup

To allow users to sign in and maintain private photo collections:

1. In the Firebase Console, go to **Authentication** ➔ **Sign-in method**.
2. Click **Get Started** if you haven't enabled it yet.
3. Enable the following providers:
   - **Google**: Click Google, switch the toggle to **Enable**, choose your Project Support Email, and click **Save**.
   - **Email/Password**: Click Email/Password, enable **Email/Password**, and click **Save**.
4. Go to **Authentication** ➔ **Settings** ➔ **Authorized domains**.
   - Ensure `localhost` is listed (Firebase adds it by default).
   - If deploying to a custom domain (e.g. `pixsort.com`), add it here.

---

## 9. Step 7: Local Development Server

Start the development server with live reload:

```bash
npm run dev
```

The app will start on port `3000`:
- **URL**: `http://localhost:3000`
- Open your browser and navigate to `http://localhost:3000`.

---

## 10. Step 8: Connecting Personal Google Drive Storage

1. Open PixSort in your browser.
2. If not logged in, click **Sign In** (via Google or Email).
3. Navigate to **Connected Storage** in the left sidebar.
4. Click **`+ Connect Google Drive`**.
5. Click **Sign in with Google Account** or enter your Google Drive email.
6. Your account will appear with its **15 GB** personal Drive quota.
7. You can connect multiple Google Drive accounts. PixSort will automatically pool them and route new uploads using capacity failover!

### Google Drive Folder Organization
In your Google Drive, photos are stored in:
```text
My Drive/
└── AI Photo Search/
    ├── Photos/
    │   └── YYYY/
    │       └── MM/
    │           └── <photo-id>.jpg
    └── Thumbnails/
        └── <photo-id>.jpg
```

---

## 11. Step 9: Production Build & Deployment

### Build Command
Compile the client application and bundle the Express server:

```bash
npm run build
```

This generates:
- `dist/index.html` and static client assets
- `dist/server.cjs` (bundled standalone Node.js server)

### Start Production Server
```bash
npm start
```

### Deploying to Cloud Run (Google Cloud)
1. Build a container using Docker:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist ./dist
COPY public ./public
COPY firebase-applet-config.json ./
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```
2. Deploy to Google Cloud Run:
```bash
gcloud run deploy pixsort \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your-gemini-key"
```

---

## 12. Troubleshooting & FAQs

### Error: `Google Drive API has not been used in project... or it is disabled (403)`
**Solution**: Enable the Google Drive API in Google Cloud Console:
👉 [Click here to enable Google Drive API](https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=68321745770)

### Error: `5 NOT_FOUND: Database not found`
**Solution**: You must create the Firestore database instance once in the Firebase Console:
👉 [Create Cloud Firestore Database](https://console.firebase.google.com/project/pixsort-62b7b/firestore)

### Error: `7 PERMISSION_DENIED: Missing or insufficient permissions`
**Solution**: Publish the Firestore security rules provided in [Step 5](#7-step-5-cloud-firestore-database-setup--security-rules).

### Error: `redirect_uri_mismatch`
**Solution**: Use the **Sign in with Google (Popup)** button in PixSort. Popup authentication uses Firebase's pre-authorized domain (`pixsort-62b7b.firebaseapp.com`) and eliminates redirect URI mismatch issues on `localhost`.
