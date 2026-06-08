import { useState, useEffect } from 'react'
import { MapPin, QrCode, Fingerprint, LogIn, UserPlus, RefreshCw, Lock, BarChart2, Users, BookOpen, Shield, Check } from 'lucide-react'
import Logo from '../../components/ui/Logo'
import QRVisual from './QRVisual'

const SECTION = { maxWidth: 1080, margin: '0 auto', padding: '80px 40px' }

// ── Hero Visual ─────────────────────────────────────────────────────────────
function HeroVisual({ seconds }) {
  return (
    <div
      className="hero-visual"
      style={{ position: 'relative', height: 480, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      {/* Warm glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 70% at 50% 50%, #FEF3C7 0%, #FFF7ED 40%, transparent 70%)' }} />

      {/* QR card */}
      <div style={{ background: '#fff', borderRadius: 24, padding: 22, boxShadow: '0 24px 60px rgba(0,0,0,.09), 0 0 0 1px rgba(0,0,0,.04)', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#A8A29E', marginBottom: 2 }}>Data Structures · Lecture 03</div>
            <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 14, fontWeight: 700, color: '#1C1917' }}>Scan to mark attendance</div>
          </div>
          <div style={{ background: seconds <= 5 ? '#FEE2E2' : '#FFF7ED', color: seconds <= 5 ? '#DC2626' : '#EA580C', fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '5px 9px', display: 'flex', alignItems: 'center', gap: 4, minWidth: 46, transition: 'background .3s' }}>
            <RefreshCw size={10} className={seconds <= 5 ? 'animate-spin' : ''} /> {seconds}s
          </div>
        </div>
        <QRVisual />
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#A8A29E' }}>Refreshes every 30 seconds</div>
      </div>

      {/* Float: Location */}
      <div style={{ position: 'absolute', top: 40, right: 4, background: '#fff', borderRadius: 16, padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,.08)', border: '1px solid #FED7AA', zIndex: 3, minWidth: 162 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFF7ED', display: 'grid', placeItems: 'center', flexShrink: 0 }}><MapPin size={16} color="#F97316" /></div>
          <div>
            <div style={{ fontSize: 11, color: '#A8A29E' }}>Location check</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#16A34A' }}>✓ Within range</div>
          </div>
        </div>
      </div>

      {/* Float: Passkey */}
      <div style={{ position: 'absolute', bottom: 96, right: 4, background: '#fff', borderRadius: 16, padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,.08)', border: '1px solid #F5F5F4', zIndex: 3, minWidth: 162 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFF7ED', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Fingerprint size={16} color="#F97316" /></div>
          <div>
            <div style={{ fontSize: 11, color: '#A8A29E' }}>Passkey</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1917', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', display: 'inline-block' }} /> Authenticating…
            </div>
          </div>
        </div>
      </div>

      {/* Float: Recorded */}
      <div style={{ position: 'absolute', bottom: 148, left: 4, background: '#fff', borderRadius: 16, padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,.08)', border: '1px solid #BBF7D0', zIndex: 3 }}>
        <div style={{ fontSize: 11, color: '#A8A29E', marginBottom: 3 }}>Attendance recorded</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 5 }}><Check size={13} /> SE-AIDS029</div>
      </div>
    </div>
  )
}

// ── Landing Page ─────────────────────────────────────────────────────────────
export default function LandingPage({ onLogin, onSignup }) {
  const [seconds, setSeconds] = useState(28)
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s <= 1 ? 30 : s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div>
      {/* ── NAV ── */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 40px', borderBottom: '1px solid #F5F5F4', position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,.93)', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <span style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 19, fontWeight: 700, color: '#1C1917' }}>Attendify</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="nav-link hide-on-mobile">Features</button>
          <button className="nav-link hide-on-mobile">Security</button>
          <button className="btn-outline" style={{ padding: '9px 18px', fontSize: 14 }} onClick={onSignup}>Sign Up</button>
          <button className="btn-primary" style={{ padding: '9px 18px', fontSize: 14 }} onClick={onLogin}>Log In</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ ...SECTION, paddingTop: 84, paddingBottom: 60 }}>
        <div className="hero-grid">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 100, padding: '5px 14px', fontSize: 13, fontWeight: 600, color: '#C2410C', marginBottom: 26 }}>
              <Shield size={13} /> Triple-Layer Attendance Verification
            </div>
            <h1 style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 'clamp(38px, 5vw, 58px)', fontWeight: 800, lineHeight: 1.07, color: '#1C1917', margin: '0 0 20px' }}>
              Attendance<br />that can't<br />be{' '}
              <span className="orange-text">faked.</span>
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: '#78716C', margin: '0 0 36px', maxWidth: 440 }}>
              GPS location, rotating QR codes, and WebAuthn passkeys — all verified server-side. Tamper-proof attendance for modern campuses.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 38 }}>
              <button className="btn-primary" onClick={onLogin}><LogIn size={15} /> Log In</button>
              <button className="btn-outline" onClick={onSignup}><UserPlus size={15} /> Create Account</button>
              <button className="btn-ghost">Guest Access</button>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { icon: <MapPin size={13} />, t: 'GPS verified' },
                { icon: <QrCode size={13} />, t: 'Rotating QR' },
                { icon: <Fingerprint size={13} />, t: 'Biometric auth' },
                { icon: <Lock size={13} />, t: 'Server-only logic' },
              ].map(({ icon, t }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#78716C', fontSize: 13 }}>
                  <span style={{ color: '#F97316' }}>{icon}</span> {t}
                </div>
              ))}
            </div>
          </div>
          <HeroVisual seconds={seconds} />
        </div>
      </section>

      {/* ── SECURITY LAYERS ── */}
      <section style={{ background: '#FAFAF9', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 100, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: '#C2410C', marginBottom: 16 }}>
              Security Architecture
            </div>
            <h2 style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 700, color: '#1C1917', marginBottom: 12 }}>
              Three layers. Zero loopholes.
            </h2>
            <p style={{ fontSize: 16, color: '#78716C', maxWidth: 520, margin: '0 auto', lineHeight: 1.72 }}>
              Every attendance record passes all three checks simultaneously — with logic running exclusively on Firebase Cloud Functions.
            </p>
          </div>

          {/* Big 3 */}
          <div className="grid-3" style={{ marginBottom: 20 }}>
            {[
              { icon: <MapPin size={22} color="#F97316" />, n: '01', title: 'GPS Location', desc: 'Students must be physically within the teacher-defined radius. Location is verified before any further step proceeds.' },
              { icon: <QrCode size={22} color="#F97316" />, n: '02', title: 'Rotating QR Code', desc: 'QR codes refresh every 20–40 seconds (admin-configurable). Old codes are invalidated instantly upon rotation.' },
              { icon: <Fingerprint size={22} color="#F97316" />, n: '03', title: 'WebAuthn Passkey', desc: 'Biometric server-challenge verification. Challenges are single-use and expire in 60 seconds. Never generated client-side.' },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div style={{ position: 'absolute', top: -8, right: 10, fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 82, fontWeight: 800, color: '#FFF7ED', lineHeight: 1, userSelect: 'none' }}>{f.n}</div>
                <div style={{ width: 50, height: 50, borderRadius: 15, background: '#FFF7ED', display: 'grid', placeItems: 'center', marginBottom: 20, position: 'relative', zIndex: 1 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 18, fontWeight: 700, color: '#1C1917', margin: '0 0 10px', position: 'relative', zIndex: 1 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#78716C', lineHeight: 1.68, margin: 0, position: 'relative', zIndex: 1 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Mini 6 */}
          <div className="grid-3x2">
            {[
              { icon: <Users size={17} color="#F97316" />, title: '4 Role System', desc: 'Admin, Teacher, Student, Guest — each with distinct permissions and dedicated dashboards.' },
              { icon: <BarChart2 size={17} color="#F97316" />, title: 'Attendance Analytics', desc: 'Per-subject percentages, teacher-wise breakdowns, and overall attendance stats for students.' },
              { icon: <Lock size={17} color="#F97316" />, title: 'Server-Side Only', desc: 'Zero client trust. All attendance verification runs exclusively in Cloud Functions.' },
              { icon: <RefreshCw size={17} color="#F97316" />, title: 'Auto Year Promotion', desc: 'Roll numbers auto-promote on a configurable annual date (default: July 1st).' },
              { icon: <BookOpen size={17} color="#F97316" />, title: 'CSV Export', desc: 'Export lecture records with System IDs, roll numbers, and full attendance data.' },
              { icon: <Shield size={17} color="#F97316" />, title: 'Permanent System IDs', desc: 'STU-XXXXX and TCH-XXXXX generated atomically on signup — never reassigned or changed.' },
            ].map((f, i) => (
              <div key={i} className="mini-card">
                <div style={{ width: 38, height: 38, borderRadius: 11, background: '#FFF7ED', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 14, fontWeight: 700, color: '#1C1917', marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 12.5, color: '#78716C', lineHeight: 1.55 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ ...SECTION, paddingTop: 72, paddingBottom: 72 }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 700, color: '#1C1917', marginBottom: 12 }}>Mark attendance in 4 steps</h2>
          <p style={{ fontSize: 15, color: '#78716C', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>The whole flow takes under 10 seconds for students.</p>
        </div>
        <div style={{ display: 'flex', maxWidth: 800, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 28, left: 'calc(12.5% + 20px)', right: 'calc(12.5% + 20px)', height: 2, background: 'linear-gradient(90deg, #FED7AA, #F97316, #FED7AA)' }} />
          {[
            { icon: <MapPin size={20} color="#F97316" />, label: 'Share location', desc: 'Student opens the app and fetches GPS coordinates.' },
            { icon: <QrCode size={20} color="#F97316" />, label: 'Scan QR', desc: 'Points camera at the teacher\'s rotating QR display.' },
            { icon: <Fingerprint size={20} color="#F97316" />, label: 'Biometric auth', desc: 'Device prompts for Face ID, fingerprint, or PIN.' },
            { icon: <Check size={20} color="#fff" />, label: 'Attendance recorded!', desc: 'Server verifies all layers and locks the record.', highlight: true },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: s.highlight ? 'linear-gradient(135deg,#F97316,#EA580C)' : '#fff', border: s.highlight ? 'none' : '2px solid #FED7AA', display: 'grid', placeItems: 'center', boxShadow: s.highlight ? '0 8px 20px rgba(249,115,22,.35)' : '0 2px 8px rgba(0,0,0,.06)', position: 'relative', zIndex: 1 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 14, fontWeight: 700, color: s.highlight ? '#F97316' : '#1C1917', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12.5, color: '#78716C', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'linear-gradient(135deg, #F97316 0%, #C2410C 100%)', padding: '72px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700, color: '#fff', marginBottom: 14 }}>Ready to secure your campus?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.8)', marginBottom: 36, lineHeight: 1.72 }}>
            Sign up as a student and start marking tamper-proof attendance in minutes. No proxy. No fraud. Just presence.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onSignup} style={{ background: '#fff', color: '#EA580C', border: 'none', borderRadius: 12, padding: '14px 26px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,.15)' }}>
              <UserPlus size={15} /> Create Student Account
            </button>
            <button onClick={onLogin} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '2px solid rgba(255,255,255,.45)', borderRadius: 12, padding: '12px 26px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Log In
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '22px 40px', borderTop: '1px solid #F5F5F4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#A8A29E', fontSize: 13, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={24} />
          <span style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 600, color: '#57534E' }}>Attendify</span>
          <span>© 2025. All rights reserved.</span>
        </div>
        <span>React · Firebase · WebAuthn · Vercel</span>
      </footer>
    </div>
  )
}