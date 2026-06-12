import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from '../firebase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  const fetchProfile = async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      const data = snap.exists() ? snap.data() : null
      setUserProfile(data)
      return data
    } catch (err) {
      console.error('fetchProfile error:', err)
      return null
    }
  }

  useEffect(() => {
    // Safety timeout — if Firebase never responds in 8 s, show the app anyway
    const timeout = setTimeout(() => {
      setLoading(false)
      setAuthError('Could not connect to Firebase. Check your .env file and internet connection.')
    }, 8000)

    let unsub
    try {
      unsub = onAuthStateChanged(
        auth,
        async (user) => {
          clearTimeout(timeout)
          setCurrentUser(user)
          if (user) await fetchProfile(user.uid)
          else setUserProfile(null)
          setLoading(false)
        },
        (err) => {
          clearTimeout(timeout)
          console.error('Auth state error:', err)
          setAuthError(err.message)
          setLoading(false)
        }
      )
    } catch (err) {
      clearTimeout(timeout)
      console.error('Firebase init error:', err)
      setAuthError(err.message)
      setLoading(false)
    }

    return () => { clearTimeout(timeout); if (unsub) unsub() }
  }, [])

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    return fetchProfile(user.uid)
  }

  const loginWithGoogle = async () => {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider())
    return fetchProfile(user.uid)
  }

  // ─── Student signup ───────────────────────────────────────────────────────
  // IMPORTANT: if the Cloud Function fails after the Firebase Auth account is
  // created, we delete the auth account to avoid orphaned users who can never
  // log in properly. Always validate on the frontend BEFORE calling this.
  const signupStudent = async ({ email, password, firstName, middleName, surname, year, branch, roll }) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await user.getIdToken(true)

    // Ensure Firebase Auth has issued and cached an ID token
    await user.getIdToken(true)

    try {
      await httpsCallable(functions, 'createStudentProfile')({
        uid: user.uid, email, firstName, middleName, surname,
        year, branch, roll: Number(roll),
      })
      return fetchProfile(user.uid)
    } catch (err) {
      // Cloud Function failed — clean up the orphaned auth account so the user
      // can try again cleanly rather than getting "Account not set up" forever.
      console.error('createStudentProfile failed, deleting auth user:', err)
      try { await user.delete() } catch (deleteErr) {
        console.error('Could not delete orphaned auth user:', deleteErr)
      }
      throw err
    }
  }

  const signupStudentWithGoogle = async ({ firstName, middleName, surname, year, branch, roll }) => {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider())

    // Ensure ID token exists before calling the function
    await user.getIdToken(true)

    try {
      await httpsCallable(functions, 'createStudentProfile')({
        uid: user.uid, email: user.email, firstName, middleName, surname,
        year, branch, roll: Number(roll),
      })
      return fetchProfile(user.uid)
    } catch (err) {
      console.error('createStudentProfile (Google) failed, deleting auth user:', err)
      try { await user.delete() } catch { }
      throw err
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth)
    setUserProfile(null)
  }

  // ─── Loading spinner ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #FED7AA', borderTopColor: '#F97316', animation: 'spin 0.9s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#78716C', margin: 0 }}>Connecting…</p>
      </div>
    )
  }

  // ─── Firebase config error ────────────────────────────────────────────────
  if (authError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#FAFAFA' }}>
        <div style={{ maxWidth: 480, width: '100%', background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,.08)', border: '1px solid #FECACA' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 20, fontWeight: 700, color: '#1C1917', margin: '0 0 8px' }}>Firebase connection failed</h2>
          <p style={{ fontSize: 14, color: '#78716C', margin: '0 0 20px', lineHeight: 1.6 }}>{authError}</p>
          <div style={{ background: '#FEF9EC', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#92400E', lineHeight: 1.7 }}>
            <strong>Things to check:</strong><br />
            1. Your <code>.env</code> file exists in the project root<br />
            2. All 6 <code>VITE_FIREBASE_*</code> keys are filled in (no quotes or spaces)<br />
            3. You restarted the dev server after editing <code>.env</code><br />
            4. Firebase Authentication and Firestore are enabled in the console
          </div>
          <button onClick={() => window.location.reload()}
            style={{ marginTop: 20, width: '100%', padding: 12, background: 'linear-gradient(135deg,#F97316,#EA580C)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, login, loginWithGoogle, signupStudent, signupStudentWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
