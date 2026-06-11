import { initializeApp }  from 'firebase/app'
import { getAuth }        from 'firebase/auth'
import { getFirestore }   from 'firebase/firestore'
import { getStorage }     from 'firebase/storage'
import { getFunctions }   from 'firebase/functions'

// ─── Validate env vars before trying to use them ─────────────────────────────
// If any key is missing, you'll see a clear error in the browser console
// instead of a confusing Firebase internal error.
const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const missing = REQUIRED_KEYS.filter((key) => !import.meta.env[key])
if (missing.length > 0) {
  console.error(
    '❌ Missing Firebase environment variables:\n' +
    missing.map((k) => `   ${k}`).join('\n') +
    '\n\nFix: open your .env file and make sure all 6 VITE_FIREBASE_* keys are filled in.\n' +
    'Then restart the dev server (stop with Ctrl+C, run npm run dev again).'
  )
}

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth      = getAuth(app)
export const db        = getFirestore(app)
export const storage   = getStorage(app)
export const functions = getFunctions(app)
export default app
