import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { Users, GraduationCap, BookOpen, LogOut, RefreshCw, ChevronDown, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { db }      from '../../firebase'
import { C, F, S } from '../../styles/theme'

const ROLES        = ['student', 'teacher', 'admin']
const ROLE_COLORS  = {
  student: { bg: '#EEF2FF', text: '#4338CA' },
  teacher: { bg: '#F0FDF4', text: '#15803D' },
  admin:   { bg: '#FFF7ED', text: '#C2410C' },
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: C.surface, borderRadius: 16, padding: '20px', boxShadow: S.card, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 46, height: 46, borderRadius: 13, background: C.orangePale, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, fontFamily: F.display, color: color ?? C.text, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

// ─── User row ─────────────────────────────────────────────────────────────────
function UserRow({ user, onRoleChange, saving }) {
  const initials = `${user.firstName?.[0] ?? ''}${user.surname?.[0] ?? ''}`.toUpperCase()
  const col = ROLE_COLORS[user.role] ?? ROLE_COLORS.student

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
      {/* Avatar */}
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,${C.orange},${C.orangeDeep})`, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: F.display, flexShrink: 0 }}>
        {initials || '?'}
      </div>

      {/* Name + IDs */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user.firstName} {user.surname}
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
          {user.systemId ?? '—'}
          {user.rollNumber ? ` · ${user.rollNumber}` : ''}
        </div>
      </div>

      {/* Email */}
      <div style={{ fontSize: 12, color: C.muted, flexShrink: 0, display: 'none', width: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
        className="hide-on-mobile">
        {user.email}
      </div>

      {/* Role selector */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <select
          value={user.role}
          disabled={saving}
          onChange={(e) => onRoleChange(user.uid, e.target.value)}
          style={{
            appearance: 'none', WebkitAppearance: 'none',
            background: col.bg, color: col.text,
            border: 'none', borderRadius: 8,
            padding: '5px 28px 5px 10px',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: F.body,
            outline: 'none',
          }}
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <ChevronDown size={11} color={col.text} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { userProfile, logout } = useAuth()
  const navigate = useNavigate()

  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(null)  // uid being saved
  const [filter,  setFilter]  = useState('all') // all | student | teacher | admin
  const [toast,   setToast]   = useState(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'users'))
      const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
      // Sort: admins first, then teachers, then students, then by name
      list.sort((a, b) => {
        const order = { admin: 0, teacher: 1, student: 2 }
        const diff = (order[a.role] ?? 3) - (order[b.role] ?? 3)
        if (diff !== 0) return diff
        return (a.firstName ?? '').localeCompare(b.firstName ?? '')
      })
      setUsers(list)
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const handleRoleChange = async (uid, newRole) => {
    setSaving(uid)
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole })
      setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, role: newRole } : u))
      showToast(`Role updated to ${newRole}`)
    } catch (err) {
      showToast('Failed to update role', true)
      console.error(err)
    } finally {
      setSaving(null)
    }
  }

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
  }

  const handleLogout = async () => { await logout(); navigate('/') }

  // Stats
  const counts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] ?? 0) + 1; return acc }, {})
  const shown  = filter === 'all' ? users : users.filter((u) => u.role === filter)

  const initials = `${userProfile?.firstName?.[0] ?? ''}${userProfile?.surname?.[0] ?? ''}`.toUpperCase()

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      {/* ── HEADER ── */}
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${C.orange},${C.orangeDeep})`, display: 'grid', placeItems: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: F.display }}>A</span>
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1 }}>Attendify</div>
            <div style={{ fontSize: 11, color: C.muted }}>Admin Panel</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${C.orange},${C.orangeDeep})`, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: F.display }}>
              {initials}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{userProfile?.firstName}</span>
            <span style={{ fontSize: 11, background: C.orangePale, color: C.orange, borderRadius: 6, padding: '2px 7px', fontWeight: 600 }}>Admin</span>
          </div>
          <button onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontWeight: 600, color: C.red, cursor: 'pointer', fontFamily: F.body }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        {/* ── STATS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
          <StatCard icon={<GraduationCap size={20} color={C.orange} />} label="Students"  value={counts.student ?? 0} />
          <StatCard icon={<BookOpen      size={20} color={C.orange} />} label="Teachers"  value={counts.teacher ?? 0} />
          <StatCard icon={<Shield        size={20} color={C.orange} />} label="Admins"    value={counts.admin   ?? 0} />
        </div>

        {/* ── USER LIST ── */}
        <div style={{ background: C.surface, borderRadius: 18, overflow: 'hidden', boxShadow: S.card }}>
          {/* Toolbar */}
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ margin: 0, fontFamily: F.display, fontSize: 16, fontWeight: 700, color: C.text }}>
              All Users <span style={{ fontWeight: 400, color: C.muted, fontSize: 14 }}>({shown.length})</span>
            </h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Filter tabs */}
              <div style={{ display: 'flex', background: '#F5F5F4', borderRadius: 10, padding: 3, gap: 3 }}>
                {['all', 'student', 'teacher', 'admin'].map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: F.body, fontSize: 12, textTransform: 'capitalize', background: filter === f ? '#fff' : 'transparent', color: filter === f ? C.text : C.muted, fontWeight: filter === f ? 600 : 400, boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,.08)' : 'none', transition: 'all .15s' }}>
                    {f}
                  </button>
                ))}
              </div>
              {/* Refresh */}
              <button onClick={loadUsers} disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.orangePale, border: `1px solid ${C.orangeBorder}`, borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: C.orange, cursor: 'pointer', fontFamily: F.body }}>
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: C.muted }}>
              <RefreshCw size={24} className="animate-spin" style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 14 }}>Loading users…</p>
            </div>
          ) : shown.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: C.faint }}>
              <Users size={28} style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No users found</p>
            </div>
          ) : (
            shown.map((u) => (
              <UserRow key={u.uid} user={u} onRoleChange={handleRoleChange} saving={saving === u.uid} />
            ))
          )}
        </div>

        {/* Instructions */}
        <div style={{ marginTop: 20, padding: '14px 18px', background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, fontSize: 13, color: C.muted, lineHeight: 1.65 }}>
          <strong style={{ color: C.secondary }}>How to set up a teacher account:</strong> Ask the teacher to sign up as a student first (any placeholder roll number). Then change their role to <em>teacher</em> above, and update their Firestore document to add a <code>subjects</code> array. Dedicated teacher signup will be added in a future update.
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: toast.isError ? '#DC2626' : '#16A34A', color: '#fff', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,.15)', zIndex: 200, whiteSpace: 'nowrap', fontFamily: F.body }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
