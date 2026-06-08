/**
 * Attendify — Firebase Cloud Functions
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  FUNCTION LIST                                              │
 * │  1.  createStudentProfile    – atomic STU-XXXXX + roll no. │
 * │  2.  createTeacherProfile    – atomic TCH-XXXXX (admin)    │
 * │  3.  createLecture           – start session + first QR    │
 * │  4.  rotateLectureQR         – rotate QR token             │
 * │  5.  endLecture              – close active session        │
 * │  6.  generateWebAuthnChallenge – server-side challenge     │
 * │  7.  verifyWebAuthnRegistration – store new passkey        │
 * │  8.  verifyAttendance        – GPS + QR + passkey check    │
 * │  9.  exportAttendanceCSV     – signed CSV download URL     │
 * │  10. promoteRollNumbers      – scheduled July 1 each year  │
 * └─────────────────────────────────────────────────────────────┘
 */

'use strict'

const functions = require('firebase-functions')
const admin     = require('firebase-admin')
const {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server')

admin.initializeApp()
const db      = admin.firestore()
const storage = admin.storage()

// ─── Update these two lines before deploying to production ───────────────────
const APP_ORIGIN      = 'http://localhost:5173'        // e.g. https://attendify.vercel.app
const APP_RP_ID       = 'localhost'                    // e.g. attendify.vercel.app
// ─────────────────────────────────────────────────────────────────────────────

const QR_TTL_MS        = 30_000   // QR token validity (30 s default)
const CHALLENGE_TTL_MS = 60_000   // WebAuthn challenge validity (60 s)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Atomically increment a named Firestore counter; return the new value. */
async function nextCounter(name) {
  const ref = db.doc(`counters/${name}`)
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const next = (snap.exists ? snap.data().value : 0) + 1
    tx.set(ref, { value: next }, { merge: true })
    return next
  })
}

/** Zero-pad n to width digits. */
const pad = (n, w = 5) => String(n).padStart(w, '0')

/** Haversine distance in metres. */
function metres(lat1, lng1, lat2, lng2) {
  const R  = 6_371_000
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Cryptographically random hex string. */
const token = (bytes = 32) => require('crypto').randomBytes(bytes).toString('hex')

// ─── 1. createStudentProfile ─────────────────────────────────────────────────
exports.createStudentProfile = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  if (ctx.auth.uid !== data.uid) throw new functions.https.HttpsError('permission-denied', 'UID mismatch.')

  const { uid, email, firstName, middleName, surname, year, branch, roll } = data
  const rollNo = Number(roll)

  if (!Number.isInteger(rollNo) || rollNo < 1 || rollNo > 300) {
    throw new functions.https.HttpsError('invalid-argument', 'Roll number must be 1–300.')
  }

  // Check roll number uniqueness within year + branch
  const dup = await db.collection('users')
    .where('year', '==', year).where('branch', '==', branch).where('roll', '==', rollNo)
    .limit(1).get()
  if (!dup.empty) {
    throw new functions.https.HttpsError('already-exists', `Roll ${rollNo} already taken in ${year}-${branch}.`)
  }

  const counter    = await nextCounter('studentCounter')
  const systemId   = `STU-${pad(counter)}`
  const rollNumber = `${year}-${branch}${pad(rollNo, 3)}`

  await db.doc(`users/${uid}`).set({
    role: 'student',
    firstName, middleName: middleName || '', surname,
    email, phone: '',
    systemId, rollNumber, year, branch, roll: rollNo,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { systemId, rollNumber }
})

// ─── 2. createTeacherProfile (admin only) ────────────────────────────────────
exports.createTeacherProfile = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  const caller = await db.doc(`users/${ctx.auth.uid}`).get()
  if (!caller.exists || caller.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admins only.')
  }

  const { uid, email, firstName, middleName, surname, subjects } = data
  const counter  = await nextCounter('teacherCounter')
  const systemId = `TCH-${pad(counter)}`

  await db.doc(`users/${uid}`).set({
    role: 'teacher',
    firstName, middleName: middleName || '', surname,
    email, phone: '',
    systemId, subjects: subjects || [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { systemId }
})

// ─── 3. createLecture ────────────────────────────────────────────────────────
exports.createLecture = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  const teacher = await db.doc(`users/${ctx.auth.uid}`).get()
  if (!teacher.exists || teacher.data().role !== 'teacher') {
    throw new functions.https.HttpsError('permission-denied', 'Teachers only.')
  }

  const { subject, lectureName, date, startTime, endTime, locationLat, locationLng, radius } = data
  const qrToken     = token()
  const qrExpiresAt = Date.now() + QR_TTL_MS

  const ref = await db.collection('lectures').add({
    teacherUid:  ctx.auth.uid,
    teacherName: `${teacher.data().firstName} ${teacher.data().surname}`,
    subject, lectureName, date, startTime, endTime,
    locationLat, locationLng,
    radius:         Number(radius) || 50,
    active:         true,
    qrToken,        qrExpiresAt,
    attendanceCount: 0,
    createdAt:      admin.firestore.FieldValue.serverTimestamp(),
  })

  return { lectureId: ref.id, qrToken, qrExpiresAt }
})

// ─── 4. rotateLectureQR ──────────────────────────────────────────────────────
exports.rotateLectureQR = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  const { lectureId } = data
  const ref     = db.doc(`lectures/${lectureId}`)
  const lecture  = await ref.get()
  if (!lecture.exists) throw new functions.https.HttpsError('not-found', 'Lecture not found.')
  if (lecture.data().teacherUid !== ctx.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Not your lecture.')
  }

  const qrToken     = token()
  const qrExpiresAt = Date.now() + QR_TTL_MS
  await ref.update({ qrToken, qrExpiresAt })
  return { qrToken, qrExpiresAt }
})

// ─── 5. endLecture ───────────────────────────────────────────────────────────
exports.endLecture = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  const { lectureId } = data
  const ref    = db.doc(`lectures/${lectureId}`)
  const lecture = await ref.get()
  if (!lecture.exists) throw new functions.https.HttpsError('not-found', 'Lecture not found.')
  if (lecture.data().teacherUid !== ctx.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Not your lecture.')
  }
  await ref.update({ active: false, qrToken: null, endedAt: admin.firestore.FieldValue.serverTimestamp() })
  return { success: true }
})

// ─── 6. generateWebAuthnChallenge ────────────────────────────────────────────
exports.generateWebAuthnChallenge = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  const uid      = ctx.auth.uid
  const { type } = data // 'registration' | 'authentication'

  let options
  if (type === 'registration') {
    const user = await db.doc(`users/${uid}`).get()
    options = await generateRegistrationOptions({
      rpName: 'Attendify', rpID: APP_RP_ID,
      userID: uid, userName: user.data().email,
      attestationType: 'none',
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
    })
  } else {
    const devSnap = await db.collection(`passkeys/${uid}/devices`).get()
    const allowCredentials = devSnap.docs.map(d => ({
      id: Buffer.from(d.data().credentialId, 'base64url'), type: 'public-key',
    }))
    options = await generateAuthenticationOptions({
      rpID: APP_RP_ID, allowCredentials, userVerification: 'required',
    })
  }

  await db.collection('webauthn_challenges').add({
    uid, type, challenge: options.challenge,
    expiresAt: Date.now() + CHALLENGE_TTL_MS, used: false,
  })

  return options
})

// ─── 7. verifyWebAuthnRegistration ───────────────────────────────────────────
exports.verifyWebAuthnRegistration = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  const uid = ctx.auth.uid
  const { response: attResp, deviceName } = data

  const snap = await db.collection('webauthn_challenges')
    .where('uid', '==', uid).where('type', '==', 'registration').where('used', '==', false)
    .orderBy('expiresAt', 'desc').limit(1).get()
  if (snap.empty) throw new functions.https.HttpsError('not-found', 'No active challenge.')

  const challengeDoc = snap.docs[0]
  const { challenge, expiresAt } = challengeDoc.data()
  if (Date.now() > expiresAt) throw new functions.https.HttpsError('deadline-exceeded', 'Challenge expired.')

  const result = await verifyRegistrationResponse({
    response: attResp, expectedChallenge: challenge,
    expectedOrigin: APP_ORIGIN, expectedRPID: APP_RP_ID,
  })
  if (!result.verified) throw new functions.https.HttpsError('invalid-argument', 'Passkey verification failed.')

  const { credentialID, credentialPublicKey, counter } = result.registrationInfo
  const credentialId = Buffer.from(credentialID).toString('base64url')

  await challengeDoc.ref.update({ used: true })
  await db.doc(`passkeys/${uid}/devices/${credentialId}`).set({
    credentialId,
    publicKey:  Buffer.from(credentialPublicKey).toString('base64url'),
    counter, deviceName: deviceName || 'Unknown device',
    createdAt:  admin.firestore.FieldValue.serverTimestamp(),
  })

  return { success: true }
})

// ─── 8. verifyAttendance — THE CRITICAL FUNCTION ─────────────────────────────
//  Validates all three layers server-side and records attendance atomically.
//  No client-side result is ever trusted.
exports.verifyAttendance = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  const uid = ctx.auth.uid
  const { lectureId, locationLat, locationLng, qrToken, webauthnResponse } = data

  // ── Layer 0: Load & validate lecture ──────────────────────────────────────
  const lectureSnap = await db.doc(`lectures/${lectureId}`).get()
  if (!lectureSnap.exists) throw new functions.https.HttpsError('not-found', 'Lecture not found.')
  const lecture = lectureSnap.data()
  if (!lecture.active) throw new functions.https.HttpsError('failed-precondition', 'This session has ended.')

  // ── Duplicate guard ────────────────────────────────────────────────────────
  const existing = await db.doc(`lectures/${lectureId}/attendance/${uid}`).get()
  if (existing.exists) throw new functions.https.HttpsError('already-exists', 'Attendance already marked.')

  // ── Layer 1: GPS location ─────────────────────────────────────────────────
  const dist = metres(locationLat, locationLng, lecture.locationLat, lecture.locationLng)
  if (dist > lecture.radius) {
    throw new functions.https.HttpsError(
      'out-of-range',
      `You are ${Math.round(dist)}m away (limit: ${lecture.radius}m). Move closer and try again.`
    )
  }

  // ── Layer 2: QR token ─────────────────────────────────────────────────────
  if (qrToken !== lecture.qrToken) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid QR code. Please scan the latest code.')
  }
  if (Date.now() > lecture.qrExpiresAt) {
    throw new functions.https.HttpsError('deadline-exceeded', 'QR code expired. Scan the latest code.')
  }

  // ── Layer 3: WebAuthn passkey ─────────────────────────────────────────────
  const challengeSnap = await db.collection('webauthn_challenges')
    .where('uid', '==', uid).where('type', '==', 'authentication').where('used', '==', false)
    .orderBy('expiresAt', 'desc').limit(1).get()
  if (challengeSnap.empty) throw new functions.https.HttpsError('not-found', 'No passkey challenge found.')

  const challengeDoc = challengeSnap.docs[0]
  const { challenge, expiresAt } = challengeDoc.data()
  if (Date.now() > expiresAt) throw new functions.https.HttpsError('deadline-exceeded', 'Passkey challenge expired.')

  const credentialId = webauthnResponse.id
  const passkeyDoc   = await db.doc(`passkeys/${uid}/devices/${credentialId}`).get()
  if (!passkeyDoc.exists) throw new functions.https.HttpsError('not-found', 'Passkey not registered on this account.')

  const pk = passkeyDoc.data()
  const result = await verifyAuthenticationResponse({
    response: webauthnResponse, expectedChallenge: challenge,
    expectedOrigin: APP_ORIGIN, expectedRPID: APP_RP_ID,
    authenticator: {
      credentialID:        Buffer.from(pk.credentialId, 'base64url'),
      credentialPublicKey: Buffer.from(pk.publicKey, 'base64url'),
      counter:             pk.counter,
    },
  })
  if (!result.verified) throw new functions.https.HttpsError('unauthenticated', 'Passkey authentication failed.')

  // Update counter (replay-attack prevention)
  await passkeyDoc.ref.update({ counter: result.authenticationInfo.newCounter })
  await challengeDoc.ref.update({ used: true })

  // ── Record attendance atomically ───────────────────────────────────────────
  const studentSnap = await db.doc(`users/${uid}`).get()
  const student     = studentSnap.data()

  const batch = db.batch()
  batch.set(db.doc(`lectures/${lectureId}/attendance/${uid}`), {
    studentUid: uid, systemId: student.systemId, rollNumber: student.rollNumber,
    locationLat, locationLng, distanceMetres: Math.round(dist),
    timestamp: admin.firestore.FieldValue.serverTimestamp(), verified: true,
  })
  batch.update(db.doc(`lectures/${lectureId}`), {
    attendanceCount: admin.firestore.FieldValue.increment(1),
  })
  batch.set(db.doc(`attendanceSummary/${uid}`), {
    [`subjects.${lecture.subject}.attended`]: admin.firestore.FieldValue.increment(1),
    totalAttended: admin.firestore.FieldValue.increment(1),
    lastUpdated:   admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })

  await batch.commit()

  return {
    success: true,
    systemId:    student.systemId,
    rollNumber:  student.rollNumber,
    subject:     lecture.subject,
    lectureName: lecture.lectureName,
    timestamp:   new Date().toISOString(),
  }
})

// ─── 9. exportAttendanceCSV ───────────────────────────────────────────────────
exports.exportAttendanceCSV = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  const { lectureId } = data
  const lecture = await db.doc(`lectures/${lectureId}`).get()
  if (!lecture.exists) throw new functions.https.HttpsError('not-found', 'Lecture not found.')
  if (lecture.data().teacherUid !== ctx.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Not your lecture.')
  }

  const rows  = await db.collection(`lectures/${lectureId}/attendance`).get()
  const lines = [
    ['System ID', 'Roll Number', 'Timestamp', 'Distance (m)', 'Verified'],
    ...rows.docs.map(d => {
      const r = d.data()
      return [r.systemId, r.rollNumber, r.timestamp?.toDate().toISOString() ?? '', r.distanceMetres ?? '', r.verified ? 'Yes' : 'No']
    }),
  ]
  const csv      = lines.map(r => r.join(',')).join('\n')
  const filePath = `exports/${ctx.auth.uid}/${lectureId}.csv`
  const file     = storage.bucket().file(filePath)

  await file.save(csv, { contentType: 'text/csv' })
  const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 15 * 60 * 1000 })
  return { url }
})

// ─── 10. promoteRollNumbers — scheduled every July 1 ─────────────────────────
//  FE → SE → TE → BE  (BE stays BE; students must be manually graduated)
exports.promoteRollNumbers = functions.pubsub
  .schedule('0 0 1 7 *')       // 00:00 IST on July 1
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const MAP   = { FE: 'SE', SE: 'TE', TE: 'BE' }
    const snap  = await db.collection('users')
      .where('role', '==', 'student').where('year', 'in', ['FE', 'SE', 'TE']).get()
    const batch = db.batch()
    snap.docs.forEach(doc => {
      const { year, branch, roll } = doc.data()
      const newYear      = MAP[year]
      const newRollNumber = `${newYear}-${branch}${pad(roll, 3)}`
      batch.update(doc.ref, { year: newYear, rollNumber: newRollNumber })
    })
    await batch.commit()
    console.log(`Promoted ${snap.size} students to next year.`)
    return null
  })
