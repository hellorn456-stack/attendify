import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Eye, EyeOff, ChevronRight, Check, UserPlus, Fingerprint, Loader2 } from 'lucide-react'
import Logo       from '../../components/ui/Logo'
import Divider    from '../../components/ui/Divider'
import GoogleIcon from '../../components/ui/GoogleIcon'
import { useAuth } from '../../contexts/AuthContext'

const YEARS        = ['FE', 'SE', 'TE', 'BE']
const YEAR_LABELS  = { FE: 'First Year', SE: 'Second Year', TE: 'Third Year', BE: 'Final Year' }
const BRANCHES     = ['CSE', 'IT', 'AIDS', 'CE', 'EE', 'ME']
const BRANCH_LABELS = {
  CSE: 'Computer Science', IT: 'Info. Technology',
  AIDS: 'AI & Data Science', CE: 'Civil',
  EE: 'Electrical', ME: 'Mechanical',
}

const STEP_TITLES = [
  ['Join Attendify',    "Choose how you'd like to register"],
  ['Personal details',  'Tell us a bit about yourself'],
  ['Academic details',  'Almost there — one last step'],
]

function StepDots({ step }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 26 }}>
      {[1, 2, 3].map((s) => (
        <div key={s} style={{
          height: 7, borderRadius: 4,
          width: s === step ? 28 : 7,
          background: s < step ? '#22C55E' : s === step ? '#F97316' : '#E7E5E4',
          transition: 'all .3s cubic-bezier(.16,1,.3,1)',
        }} />
      ))}
    </div>
  )
}

export default function SignupModal({ onClose, onLogin }) {
  const { signupStudent, signupStudentWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [step,    setStep]    = useState(1)
  const [method,  setMethod]  = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const [form, setForm] = useState({
    firstName: '', middleName: '', surname: '',
    email: '', password: '',
    year: '', branch: '', roll: '',
  })

  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  // ── Live roll number preview ──────────────────────────────────────────────
  const rollNum    = parseInt(form.roll, 10)
  const rollValid  = form.roll !== '' && !isNaN(rollNum) && rollNum >= 1 && rollNum <= 300
  const previewRoll = rollValid && form.year && form.branch
    ? `${form.year}-${form.branch}${String(rollNum).padStart(3, '0')}`
    : null

  // ── Step 2 validation ─────────────────────────────────────────────────────
  const validateStep2 = () => {
    if (!form.firstName.trim()) { setError('First name is required.'); return false }
    if (!form.surname.trim())   { setError('Surname is required.'); return false }
    if (method === 'email') {
      if (!form.email.trim())    { setError('Email is required.'); return false }
      if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return false }
    }
    setError('')
    return true
  }

  // ── Step 3 validation — runs entirely on the client before touching Firebase
  const validateStep3 = () => {
    if (!form.year)   { setError('Please select an academic year.'); return false }
    if (!form.branch) { setError('Please select a branch.'); return false }
    if (!form.roll)   { setError('Roll number is required.'); return false }

    if (isNaN(rollNum) || !Number.isInteger(rollNum)) {
      setError('Roll number must be a whole number.')
      return false
    }
    if (rollNum < 1 || rollNum > 300) {
      setError(`Roll number must be between 1 and 300. You entered ${form.roll}.`)
      return false
    }

    setError('')
    return true
  }

  const handleCreate = async () => {
    if (!validateStep3()) return

    setLoading(true)
    setError('')
    try {
      if (method === 'google') {
        await signupStudentWithGoogle({ ...form, roll: rollNum })
      } else {
        await signupStudent({ ...form, roll: rollNum })
      }
      navigate('/student')
    } catch (e) {
      // Show the actual error from Firebase / Cloud Function,
      // not just "internal". If the message is bare "internal",
      // give a friendlier explanation.
      const msg = e?.message ?? ''
      if (msg.toLowerCase() === 'internal') {
        setError('Server error — Cloud Functions may not be deployed yet. Run: firebase deploy --only functions')
      } else {
        setError(msg || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
            <Logo size={28} />
            <span style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 15 }}>Attendify</span>
          </div>
          <h2 style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 22, fontWeight: 800, color: '#1C1917', margin: '0 0 3px' }}>
            {STEP_TITLES[step - 1][0]}
          </h2>
          <p style={{ color: '#78716C', fontSize: 13, margin: 0 }}>{STEP_TITLES[step - 1][1]}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A29E', lineHeight: 0, padding: 4 }}>
          <X size={20} />
        </button>
      </div>

      <StepDots step={step} />

      {/* ── Step 1: Auth method ─────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <button className="google-btn" onClick={() => { setMethod('google'); setStep(2) }} style={{ marginBottom: 12 }}>
            <GoogleIcon /> Sign up with Google
          </button>
          <Divider />
          <button className="btn-outline" onClick={() => { setMethod('email'); setStep(2) }}
            style={{ width: '100%', justifyContent: 'center' }}>
            <UserPlus size={15} /> Sign up with Email & Password
          </button>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#78716C', marginTop: 22 }}>
            Already registered?{' '}
            <button onClick={onLogin} style={{ background: 'none', border: 'none', color: '#F97316', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
              Log in
            </button>
          </p>
        </div>
      )}

      {/* ── Step 2: Personal details ─────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#57534E', display: 'block', marginBottom: 6 }}>First Name *</label>
              <input className="input-field" placeholder="John"
                value={form.firstName} onChange={(e) => upd('firstName', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#57534E', display: 'block', marginBottom: 6 }}>
                Middle Name <span style={{ fontWeight: 400, color: '#A8A29E' }}>(opt.)</span>
              </label>
              <input className="input-field" placeholder="—"
                value={form.middleName} onChange={(e) => upd('middleName', e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#57534E', display: 'block', marginBottom: 6 }}>Surname *</label>
            <input className="input-field" placeholder="Doe"
              value={form.surname} onChange={(e) => upd('surname', e.target.value)} />
          </div>

          {method === 'email' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#57534E', display: 'block', marginBottom: 6 }}>Email *</label>
                <input className="input-field" type="email" placeholder="you@college.edu"
                  value={form.email} onChange={(e) => upd('email', e.target.value)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#57534E', display: 'block', marginBottom: 6 }}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input className="input-field" type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters" value={form.password}
                    onChange={(e) => upd('password', e.target.value)} style={{ paddingRight: 44 }} />
                  <button onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A8A29E', lineHeight: 0 }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && (
            <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13, color: '#DC2626', marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button className="btn-ghost" style={{ flexShrink: 0, padding: '12px 18px' }} onClick={() => { setStep(1); setError('') }}>
              Back
            </button>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => validateStep2() && setStep(3)}>
              Continue <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Academic details ─────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#57534E', display: 'block', marginBottom: 6 }}>Academic Year *</label>
              <select className="select-field" value={form.year} onChange={(e) => upd('year', e.target.value)}>
                <option value="">Select year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y} — {YEAR_LABELS[y]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#57534E', display: 'block', marginBottom: 6 }}>Branch *</label>
              <select className="select-field" value={form.branch} onChange={(e) => upd('branch', e.target.value)}>
                <option value="">Select branch</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b} — {BRANCH_LABELS[b]}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#57534E', display: 'block', marginBottom: 6 }}>
              Roll Number *{' '}
              <span style={{ fontWeight: 400, color: '#A8A29E', fontSize: 12 }}>(1 – 300)</span>
            </label>
            <input
              className="input-field"
              type="number"
              placeholder="e.g. 29"
              min={1}
              max={300}
              value={form.roll}
              onChange={(e) => { upd('roll', e.target.value); setError('') }}
              style={{ borderColor: form.roll && !rollValid ? '#DC2626' : undefined }}
            />

            {/* Real-time feedback */}
            {form.roll && !rollValid && (
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: '#DC2626' }}>
                Must be a whole number between 1 and 300.
              </p>
            )}
            {previewRoll && (
              <div style={{ marginTop: 8, padding: '10px 14px', background: '#FFF7ED', borderRadius: 10, border: '1px solid #FED7AA', fontSize: 13, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
                Your roll number: <code style={{ fontWeight: 700, letterSpacing: '0.5px' }}>{previewRoll}</code>
              </div>
            )}
          </div>

          <div style={{ padding: '12px 16px', background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Fingerprint size={15} color="#15803D" style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 12.5, color: '#15803D', lineHeight: 1.55 }}>
              After registration you'll be prompted to register a <strong>WebAuthn passkey</strong> — required to mark attendance.
            </p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13, color: '#DC2626', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-ghost" style={{ flexShrink: 0, padding: '12px 18px' }}
              onClick={() => { setStep(2); setError('') }} disabled={loading}>
              Back
            </button>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}
              onClick={handleCreate} disabled={loading || !rollValid}>
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Creating…</>
                : <><Check size={15} /> Create Account</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
