import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword, signInWithPopup,
  createUserWithEmailAndPassword, GoogleAuthProvider,
  signOut, onAuthStateChanged,
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
  const [loading, setLoading]         = useState(true)

  const fetchProfile = async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      const data = snap.exists() ? snap.data() : null
      setUserProfile(data)
      return data
    } catch { return null }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) await fetchProfile(user.uid)
      else setUserProfile(null)
      setLoading(false)
    })
    return unsub
  }, [])

  const login = async (email, password) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    return fetchProfile(user.uid)
  }

  const loginWithGoogle = async () => {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider())
    return fetchProfile(user.uid)
  }

  // Creates Firebase Auth user then calls Cloud Function to assign STU-XXXXX
  const signupStudent = async ({ email, password, firstName, middleName, surname, year, branch, roll }) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await httpsCallable(functions, 'createStudentProfile')({ uid: user.uid, email, firstName, middleName, surname, year, branch, roll: Number(roll) })
    return fetchProfile(user.uid)
  }

  const signupStudentWithGoogle = async ({ firstName, middleName, surname, year, branch, roll }) => {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider())
    await httpsCallable(functions, 'createStudentProfile')({ uid: user.uid, email: user.email, firstName, middleName, surname, year, branch, roll: Number(roll) })
    return fetchProfile(user.uid)
  }

  const logout = async () => { await signOut(auth); setUserProfile(null) }

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, login, loginWithGoogle, signupStudent, signupStudentWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
