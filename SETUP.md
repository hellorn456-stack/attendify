# Attendify — Complete Setup Guide

> This guide walks you through everything — from zero to a fully running app — step by step. No experience assumed.

---

## Table of Contents

1. [What You're Building](#1-what-youre-building)
2. [How the App Works](#2-how-the-app-works)
3. [Project Structure Explained](#3-project-structure-explained)
4. [What You Need to Install First](#4-what-you-need-to-install-first)
5. [Step 1 — Create a Firebase Project](#step-1--create-a-firebase-project)
6. [Step 2 — Enable Firebase Services](#step-2--enable-firebase-services)
7. [Step 3 — Get Your Firebase Config Keys](#step-3--get-your-firebase-config-keys)
8. [Step 4 — Set Up the Project Locally](#step-4--set-up-the-project-locally)
9. [Step 5 — Configure Environment Variables](#step-5--configure-environment-variables)
10. [Step 6 — Run the App](#step-6--run-the-app)
11. [Step 7 — Deploy Firebase Rules & Indexes](#step-7--deploy-firebase-rules--indexes)
12. [Step 8 — Deploy Cloud Functions](#step-8--deploy-cloud-functions)
13. [Step 9 — Deploy the Frontend to Vercel](#step-9--deploy-the-frontend-to-vercel)
14. [Step 10 — Update WebAuthn Origins for Production](#step-10--update-webauthn-origins-for-production)
15. [How to Create the First Admin User](#how-to-create-the-first-admin-user)
16. [Firestore Data Model](#firestore-data-model)
17. [What Each Cloud Function Does](#what-each-cloud-function-does)
18. [Common Errors & Fixes](#common-errors--fixes)
19. [Development Tips](#development-tips)

---

## 1. What You're Building

**Attendify** is a web-based attendance management system for colleges. It uses three layers of verification to make sure a student is actually physically present — not sharing screenshots or sending a friend.

| Layer | What it checks |
|-------|---------------|
| 📍 GPS | Student is within the teacher's configured radius (e.g. 50 metres of the classroom) |
| 📱 QR Code | Student scans a QR code that rotates every 30 seconds (screenshots are useless) |
| 🔑 WebAuthn | Student authenticates with their device's biometrics (Face ID, fingerprint, or PIN) |

All three are verified **server-side** by Firebase Cloud Functions. The frontend never decides if attendance is valid.

---

## 2. How the App Works

```
Student opens app
  → Fetches GPS location
  → Scans teacher's rotating QR code
  → Authenticates with biometric passkey
  → Cloud Function validates all 3 layers
  → Attendance recorded in Firestore ✓
```

**Roles in the system:**

| Role | What they can do |
|------|-----------------|
| Admin | Configure the system, manage users, change branches, set QR intervals |
| Teacher | Create lectures, display QR codes, view and export attendance |
| Student | Mark attendance, view lecture history, see attendance report |
| Guest | Read-only access (if enabled by Admin) |

---

## 3. Project Structure Explained

```
attendify/
│
├── .env.example          ← Template for your secret keys (safe to commit)
├── .env                  ← Your actual secret keys (NEVER commit this)
├── .gitignore            ← Tells git what to ignore (.env, node_modules, etc.)
├── .firebaserc           ← Tells Firebase CLI which project to use
│
├── firebase.json         ← Firebase config: which rules file, which folder to deploy, etc.
├── firestore.rules       ← Security rules — who can read/write what in the database
├── firestore.indexes.json← Database indexes for fast queries
├── storage.rules         ← Security rules for file uploads (profile pics, CSV exports)
│
├── index.html            ← The single HTML file the browser loads
├── package.json          ← Frontend dependencies (React, Firebase SDK, etc.)
├── vite.config.js        ← Build tool config (Vite bundles your React code)
│
├── public/
│   └── favicon.svg       ← The little orange "A" icon in the browser tab
│
├── src/                  ← All React frontend code
│   ├── main.jsx          ← Entry point — mounts React into index.html
│   ├── App.jsx           ← Sets up routing (which page to show for which URL)
│   ├── firebase.js       ← Connects to Firebase using your .env keys
│   │
│   ├── styles/
│   │   ├── global.css    ← Global styles: fonts, buttons, inputs, animations
│   │   └── theme.js      ← Shared colour & font constants used across components
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx  ← Manages login state; provides login/logout/signup to all components
│   │
│   ├── components/
│   │   ├── ProtectedRoute.jsx   ← Redirects to / if user isn't logged in or wrong role
│   │   └── ui/
│   │       ├── Logo.jsx         ← The orange "A" logo component
│   │       ├── Divider.jsx      ← The "— or —" line between buttons
│   │       └── GoogleIcon.jsx   ← Google's coloured G icon
│   │
│   └── pages/
│       ├── Landing/             ← The public homepage
│       │   ├── index.jsx        ← Full landing page (hero, features, CTA)
│       │   ├── LoginModal.jsx   ← Login popup
│       │   ├── SignupModal.jsx  ← 3-step signup popup
│       │   └── QRVisual.jsx    ← Decorative QR code in the hero section
│       │
│       ├── Student/             ← Student dashboard (mobile-first, bottom nav)
│       │   ├── index.jsx        ← Shell: header + bottom nav + tab switching
│       │   ├── MarkAttendance.jsx  ← The 3-step attendance flow (GPS → QR → passkey)
│       │   ├── MyLectures.jsx      ← List of attended lectures with filters
│       │   ├── AttendanceReport.jsx← Donut chart + per-subject breakdown
│       │   └── StudentProfile.jsx  ← Name, IDs, passkeys, logout
│       │
│       └── Teacher/             ← Teacher dashboard (mobile-first, bottom nav)
│           ├── index.jsx        ← Shell: header + bottom nav + tab switching
│           ├── CreateLecture.jsx   ← Form to create lecture + live QR display
│           ├── LectureHistory.jsx  ← Past lectures with attendance stats + CSV export
│           └── TeacherProfile.jsx  ← Teacher info, subjects (read-only), logout
│
└── functions/            ← Firebase Cloud Functions (Node.js, runs on Google servers)
    ├── package.json      ← Server-side dependencies (@simplewebauthn/server, etc.)
    └── index.js          ← All 10 Cloud Functions
```

---

## 4. What You Need to Install First

Open your terminal (on Mac: `Terminal` app; on Windows: `Command Prompt` or `PowerShell`).

### Node.js (required — everything depends on this)

Check if you already have it:
```bash
node --version
```

If you see something like `v18.x.x` or higher, you're good. If not, download it from:
**https://nodejs.org** — click the "LTS" button and install it.

Verify after installing:
```bash
node --version   # should print v18 or higher
npm --version    # should print 9 or higher
```

### Git (required for GitHub)

Check:
```bash
git --version
```

If not installed: **https://git-scm.com/downloads**

### Firebase CLI (required for deployment)

```bash
npm install -g firebase-tools
```

Then log in:
```bash
firebase login
```

A browser window will open. Sign in with the same Google account you'll use for Firebase.

Verify:
```bash
firebase --version   # should print 13 or higher
```

---

## Step 1 — Create a Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Enter a project name — e.g. `attendify-prod`
4. When asked about Google Analytics — you can disable it (not needed for this app)
5. Click **"Create project"** and wait about 30 seconds
6. Click **"Continue"** when it's done

You now have a Firebase project. Keep this browser tab open.

---

## Step 2 — Enable Firebase Services

You need to enable 4 services. Do each one:

### A) Authentication

1. In the left sidebar, click **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Under **"Sign-in method"** tab, click **"Google"** → toggle it **on** → click **"Save"**
4. Click **"Add new provider"** → click **"Email/Password"** → toggle the first option **on** → click **"Save"**

### B) Firestore Database

1. In the left sidebar, click **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll upload the proper security rules in Step 7)
4. Choose a location — pick the one closest to your users (e.g. `asia-south1` for India)
5. Click **"Enable"** and wait ~30 seconds

### C) Storage

1. In the left sidebar, click **"Build"** → **"Storage"**
2. Click **"Get started"**
3. Click **"Next"** (keep the default rules for now)
4. Pick the same location as Firestore
5. Click **"Done"**

### D) Cloud Functions

1. In the left sidebar, click **"Build"** → **"Functions"**
2. Click **"Get started"**
3. It may ask you to upgrade to the **Blaze (pay-as-you-go) plan**

> ⚠️ **Important:** Cloud Functions require the Blaze plan. Don't worry — for a college-scale app, the usage will almost certainly stay within the free tier limits (2 million function calls/month are free). You only pay if you exceed that. Add a billing account but set a budget alert at ₹100 or $1 so you get notified if anything unexpected happens.

---

## Step 3 — Get Your Firebase Config Keys

1. In the Firebase Console, click the **gear icon ⚙️** next to "Project Overview" in the top-left
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **"</>"** (web) icon to add a web app
5. Enter a name like `attendify-web`
6. **Do NOT** check "Firebase Hosting" (we're using Vercel)
7. Click **"Register app"**
8. You'll see a code block like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "attendify-prod.firebaseapp.com",
  projectId: "attendify-prod",
  storageBucket: "attendify-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Copy these values** — you'll need them in Step 5.

9. Click **"Continue to console"**

Also note your **Project ID** — it's shown at the top of Project Settings (e.g. `attendify-prod`).

---

## Step 4 — Set Up the Project Locally

### Clone or unzip the project

If you downloaded the zip:
```bash
# Unzip it, then navigate into the folder
cd attendify
```

If you're setting up Git:
```bash
git init
git add .
git commit -m "initial commit"
```

### Install frontend dependencies

```bash
# Make sure you're in the attendify/ root folder
npm install
```

This downloads React, Firebase SDK, and all other packages into `node_modules/`. It takes 1–2 minutes.

### Install Cloud Function dependencies

```bash
cd functions
npm install
cd ..
```

This installs the server-side packages (`@simplewebauthn/server`, etc.) needed by your Cloud Functions.

---

## Step 5 — Configure Environment Variables

Environment variables are secret keys that your app needs to talk to Firebase. They live in a `.env` file that is **never uploaded to GitHub**.

### Create your .env file

```bash
# In the attendify/ root folder:
cp .env.example .env
```

Now open `.env` in any text editor (VS Code, Notepad, etc.) and fill in your values:

```env
VITE_FIREBASE_API_KEY=AIzaSy...          ← paste your apiKey
VITE_FIREBASE_AUTH_DOMAIN=attendify-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=attendify-prod  ← your project ID
VITE_FIREBASE_STORAGE_BUCKET=attendify-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

> **Why the VITE_ prefix?** Vite (the build tool) only exposes variables to the browser that start with `VITE_`. This is a security feature.

> **Why is .env in .gitignore?** If you accidentally push your API keys to a public GitHub repo, bots scan for them within seconds and could abuse your Firebase project. The `.gitignore` file prevents this automatically.

### Update .firebaserc

Open `.firebaserc` and replace `your-firebase-project-id` with your actual project ID:

```json
{
  "projects": {
    "default": "attendify-prod"
  }
}
```

---

## Step 6 — Run the App

```bash
npm run dev
```

Open your browser and go to **http://localhost:5173**

You should see the Attendify landing page. The login/signup won't work yet because we haven't deployed the Cloud Functions (that's next), but the UI is fully visible.

To stop the server: press `Ctrl + C` in the terminal.

---

## Step 7 — Deploy Firebase Rules & Indexes

This uploads your security rules (who can read/write what) and database indexes (for fast queries) to Firebase.

```bash
# Make sure you're logged into Firebase CLI
firebase login

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Expected output:
```
✔  firestore: released rules firestore.rules
✔  firestore: deployed indexes in firestore.indexes.json
✔  storage: released rules storage.rules
```

If you see errors, make sure your `.firebaserc` has the correct project ID.

---

## Step 8 — Deploy Cloud Functions

This uploads your 10 server-side functions to Google's servers. They run automatically when called from the app.

```bash
firebase deploy --only functions
```

This takes **3–5 minutes** the first time. You'll see each function being uploaded:

```
✔  functions: Finished running predeploy script.
i  functions: updating Node.js 18 function createStudentProfile...
✔  functions[createStudentProfile]: Successful update
i  functions: updating Node.js 18 function createTeacherProfile...
✔  functions[createTeacherProfile]: Successful update
... (and so on for all 10 functions)
```

### After deploying — update your WebAuthn origins (important!)

Open `functions/index.js` and find lines 26–27:

```js
const APP_ORIGIN = 'http://localhost:5173'
const APP_RP_ID  = 'localhost'
```

For local development, these are correct. Once you deploy to Vercel (Step 9), update them:

```js
const APP_ORIGIN = 'https://your-attendify-app.vercel.app'
const APP_RP_ID  = 'your-attendify-app.vercel.app'
```

Then redeploy: `firebase deploy --only functions`

---

## Step 9 — Deploy the Frontend to Vercel

Vercel is a free hosting platform that works perfectly with React + Vite apps.

### Create a GitHub repository (if you haven't)

```bash
# In the attendify/ folder:
git init
git add .
git commit -m "initial commit"
```

Go to **https://github.com** → click **"New repository"** → name it `attendify` → click **"Create repository"**

Then follow GitHub's instructions to push your code. It looks like:

```bash
git remote add origin https://github.com/YOUR_USERNAME/attendify.git
git branch -M main
git push -u origin main
```

> Your `.env` file will NOT be pushed because it's in `.gitignore`. Only `.env.example` goes up.

### Deploy on Vercel

1. Go to **https://vercel.com** and sign in with GitHub
2. Click **"Add New Project"**
3. Find and click on your `attendify` repository
4. Under **"Framework Preset"**, select **"Vite"**
5. Click **"Environment Variables"** and add all 6 variables from your `.env` file:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
6. Click **"Deploy"**

After ~2 minutes, you'll get a URL like `https://attendify-xyz.vercel.app`. That's your live app!

---

## Step 10 — Update WebAuthn Origins for Production

WebAuthn (the passkey system) is strict about origins — it only works if the origin in your code matches where the app is actually served from.

1. Copy your Vercel URL (e.g. `https://attendify-xyz.vercel.app`)
2. Open `functions/index.js`
3. Update lines 26–27:

```js
const APP_ORIGIN = 'https://attendify-xyz.vercel.app'   // your Vercel URL
const APP_RP_ID  = 'attendify-xyz.vercel.app'           // same, WITHOUT https://
```

4. Redeploy functions:
```bash
firebase deploy --only functions
```

Also, add your Vercel domain to Firebase Auth's allowed domains:
1. Firebase Console → Authentication → Settings → Authorized domains
2. Click **"Add domain"** → paste `attendify-xyz.vercel.app` → click **"Add"**

---

## How to Create the First Admin User

The Admin role can't be created through the normal signup form (for security). Here's how to manually set it up:

### Step 1: Create a regular account

Go to your app and create a student account with your own email.

### Step 2: Find your User UID

1. Firebase Console → Authentication → Users tab
2. Find your email → copy the UID (looks like `abc123def456...`)

### Step 3: Manually update Firestore

1. Firebase Console → Firestore Database
2. Click **"Start collection"** or find the `users` collection
3. Find the document with your UID
4. Click **"Edit"** and change `role` from `"student"` to `"admin"`

Or use the Firebase Console's built-in document editor to set:
```
role: "admin"
```

That user can now access the Admin panel and create teacher profiles.

---

## Firestore Data Model

This is how data is organised in the database:

```
/users/{uid}
  ├── role:         "student" | "teacher" | "admin"
  ├── firstName, middleName, surname
  ├── email, phone
  ├── systemId:     "STU-00142" or "TCH-00015"
  ├── rollNumber:   "SE-AIDS029"    (students only)
  ├── year, branch, roll            (students only)
  ├── subjects: [...]               (teachers only)
  └── createdAt

/counters/studentCounter
  └── value: 142    ← auto-increments for each new student

/counters/teacherCounter
  └── value: 15     ← auto-increments for each new teacher

/lectures/{lectureId}
  ├── teacherUid, teacherName
  ├── subject, lectureName, date, startTime, endTime
  ├── locationLat, locationLng, radius
  ├── active: true | false
  ├── qrToken        ← rotates every 30s
  ├── qrExpiresAt
  ├── attendanceCount
  └── /attendance/{studentUid}
        ├── studentUid, systemId, rollNumber
        ├── locationLat, locationLng, distanceMetres
        ├── timestamp
        └── verified: true

/webauthn_challenges/{id}
  ├── uid, type ("registration" | "authentication")
  ├── challenge
  ├── expiresAt      ← 60 seconds from creation
  └── used: false    ← set to true after use (prevents replay)

/passkeys/{uid}/devices/{credentialId}
  ├── credentialId, publicKey, counter
  ├── deviceName     ← e.g. "iPhone 14 Pro"
  └── createdAt

/attendanceSummary/{uid}
  ├── totalAttended
  ├── subjects.{SubjectName}.attended
  └── lastUpdated

/appConfig/settings
  ├── qrIntervalSeconds: 30
  ├── maxRollNumber: 300
  ├── promotionDate: "07-01"
  ├── guestAccessEnabled: false
  └── branches: ["CSE", "IT", "AIDS", "CE", "EE", "ME"]
```

---

## What Each Cloud Function Does

| Function | Who calls it | What it does |
|----------|-------------|-------------|
| `createStudentProfile` | Frontend (after signup) | Atomically assigns `STU-XXXXX`, checks roll number uniqueness, creates user doc |
| `createTeacherProfile` | Admin panel | Atomically assigns `TCH-XXXXX`, creates teacher doc |
| `createLecture` | Teacher dashboard | Creates lecture doc with GPS coords and first QR token |
| `rotateLectureQR` | Teacher (auto, every 30s) | Replaces QR token with a new random one; invalidates the old one immediately |
| `endLecture` | Teacher dashboard | Sets `active: false`, clears QR token |
| `generateWebAuthnChallenge` | Student (before passkey) | Creates a random server-side challenge — never client-generated |
| `verifyWebAuthnRegistration` | Student (during setup) | Verifies and stores a new passkey |
| `verifyAttendance` | Student (mark attendance) | **The main function** — validates GPS + QR + passkey, then records attendance atomically |
| `exportAttendanceCSV` | Teacher dashboard | Generates CSV, uploads to Storage, returns a 15-min download link |
| `promoteRollNumbers` | Scheduled (July 1, 00:00 IST) | Updates year prefix: FE→SE, SE→TE, TE→BE for all students |

---

## Common Errors & Fixes

### "FirebaseError: Missing or insufficient permissions"
**Cause:** Firestore rules are blocking a read/write.
**Fix:** Make sure you deployed the rules in Step 7:
```bash
firebase deploy --only firestore:rules
```

### "FirebaseError: The caller does not have permission"
**Cause:** Trying to call a Cloud Function before Firebase Auth is set up, or calling a function that requires a specific role.
**Fix:** Make sure the user is logged in and has the correct role in their Firestore document.

### "auth/unauthorized-domain"
**Cause:** Your app's domain isn't in Firebase Auth's allowed list.
**Fix:** Firebase Console → Authentication → Settings → Authorized domains → Add your Vercel URL.

### "WebAuthn not working" / passkey errors
**Cause:** `APP_ORIGIN` or `APP_RP_ID` in `functions/index.js` doesn't match where the app is served.
**Fix:** Update those two variables to match your actual URL and redeploy functions.

### "FirebaseError: 9 FAILED_PRECONDITION: The query requires an index"
**Cause:** A Firestore query needs a composite index that hasn't been deployed yet.
**Fix:**
```bash
firebase deploy --only firestore:indexes
```
Or click the link in the error message — it takes you directly to the Firebase Console to create it.

### "functions: Failed to load function definition from source"
**Cause:** A syntax error in `functions/index.js`.
**Fix:** Run `node functions/index.js` locally to see the error, then fix it.

### npm install fails
**Cause:** Wrong Node version.
**Fix:** Install Node 18+ from https://nodejs.org

### Changes not showing up after `npm run dev`
**Cause:** Vite should hot-reload automatically. If it doesn't, stop the server (Ctrl+C) and run `npm run dev` again.

---

## Development Tips

### Running with Firebase Emulators (optional, but useful)

You can run Firestore, Functions, and Auth locally without hitting the real Firebase:

```bash
# Install Java first (required for emulators): https://java.com
firebase emulators:start
```

This runs everything locally so you don't use up your cloud quota during development.

### Useful Firebase CLI commands

```bash
firebase deploy                          # deploy everything
firebase deploy --only functions         # deploy only Cloud Functions
firebase deploy --only firestore:rules   # deploy only security rules
firebase functions:log                   # view function logs
firebase emulators:start                 # run everything locally
```

### Viewing database in browser

Firebase Console → Firestore → you can see and edit all documents directly.

### Viewing function logs

```bash
firebase functions:log
```

Or: Firebase Console → Functions → Logs tab.

### If you make a mistake in Firestore

You can edit documents directly in the Firebase Console. Just click on any document and use the pencil icon to edit fields.

---

## Quick Reference — Commands You'll Use Often

```bash
# Start local development
npm run dev

# Build for production
npm run build

# Deploy everything (rules + functions + hosting)
firebase deploy

# Deploy only what changed
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# View function logs
firebase functions:log --limit 50

# Push new code to GitHub (Vercel auto-deploys on push)
git add .
git commit -m "your message here"
git push
```

---

*Attendify — Built with React, Firebase, and WebAuthn.*
