# Attendify

> Tamper-proof attendance management — GPS + Rotating QR + WebAuthn Passkey.

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | React 18 + Vite                                 |
| Backend / DB | Firebase Firestore                              |
| Auth         | Firebase Authentication (Google + Email/Pass)   |
| Passkeys     | WebAuthn (`@simplewebauthn/browser` + server)   |
| Functions    | Firebase Cloud Functions                        |
| Storage      | Firebase Storage                                |
| Hosting      | Vercel                                          |

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/attendify.git
cd attendify
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → Create a new project
2. Enable **Authentication** → Sign-in methods: Google + Email/Password
3. Enable **Firestore Database** (start in test mode, then add rules)
4. Enable **Storage**
5. Enable **Cloud Functions**
6. Go to **Project Settings → Your Apps → Add web app** → copy the config

### 3. Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase config values:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> ⚠️ `.env` is in `.gitignore` — it will **never** be committed.  
> Only `.env.example` (with placeholder values) is committed.

### 4. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
attendify/
├── .env.example              # ← copy to .env and fill in Firebase keys
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx              # React entry point
    ├── App.jsx               # Root: view state + modal routing
    ├── firebase.js           # Firebase init (reads from .env)
    ├── styles/
    │   └── global.css        # CSS vars, resets, shared utility classes
    ├── components/
    │   └── ui/
    │       ├── Logo.jsx
    │       ├── Divider.jsx
    │       └── GoogleIcon.jsx
    └── pages/
        └── Landing/
            ├── index.jsx     # Full landing page
            ├── LoginModal.jsx
            ├── SignupModal.jsx
            └── QRVisual.jsx  # Decorative QR code component
```

---

## Roles

| Role    | Access                                              |
|---------|-----------------------------------------------------|
| Admin   | Full system control, user & config management       |
| Teacher | Create lectures, generate QR, view attendance       |
| Student | Mark attendance, view reports, manage passkeys      |
| Guest   | Read-only (toggled by Admin)                        |

## Attendance Flow (Student)

```
Open App → Share GPS → Scan QR → WebAuthn Passkey → Attendance Recorded ✓
```

All three verifications run **server-side** via Cloud Functions.  
No client-side attendance logic is ever trusted.

---

## ID Format

| Role    | Format            | Example      |
|---------|-------------------|--------------|
| Student | `STU-{5 digits}`  | `STU-00142`  |
| Teacher | `TCH-{5 digits}`  | `TCH-00015`  |

Roll number format: `{YEAR}-{BRANCH}{3-digit roll}` → e.g. `SE-AIDS029`

---

## Deployment (Vercel)

```bash
npm run build
```

Push to GitHub → import repo in [Vercel](https://vercel.com) → add the same environment variables in Vercel's project settings → Deploy.

---

## Roadmap

- [x] Landing page + Login/Signup UI
- [ ] Firebase Auth integration
- [ ] Student dashboard (mark attendance, reports)
- [ ] Teacher dashboard (create lecture, QR display)
- [ ] Admin panel
- [ ] WebAuthn passkey registration & verification
- [ ] Cloud Functions (ID generation, attendance logic, QR tokens)
- [ ] Rotating QR with server-side token validation
- [ ] Annual roll number promotion scheduler
