'use strict'

/**
 * Attendify — Cloud Functions
 * Key change from previous version: @simplewebauthn/server is now required
 * lazily (inside each function that needs it) instead of at the top level.
 * This means a WebAuthn load error cannot crash createStudentProfile,
 * createLecture, verifyAttendance, etc.
 */

const functions = require('firebase-functions')
const admin     = require('firebase-admin')
const { onSchedule } = require('firebase-functions/v2/scheduler')

admin.initializeApp()
const db      = admin.firestore()
const storage = admin.storage()

// ─── Update before deploying to production ────────────────────────────────────
const APP_ORIGIN      = 'http://localhost:5173'   // e.g. https://attendify.vercel.app
const APP_RP_ID       = 'localhost'               // e.g. attendify.vercel.app
// ─────────────────────────────────────────────────────────────────────────────

const QR_TTL_MS        = 30_000
const CHALLENGE_TTL_MS = 60_000

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function nextCounter(name) {
  const ref = db.doc(`counters/${name}`)
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const next = (snap.exists ? snap.data().value : 0) + 1
    tx.set(ref, { value: next }, { merge: true })
    return next
  })
}

const pad = (n, w = 5) => String(n).padStart(w, '0')

function metres(lat1, lng1, lat2, lng2) {
  const R  = 6_371_000
  const p1 = (lat1 * Math.PI) / 180, p2 = (lat2 * Math.PI) / 180
  const dp = ((lat2 - lat1) * Math.PI) / 180
  const dl = ((lng2 - lng1) * Math.PI) / 180
  const a  = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const randomToken = (bytes = 32) =>
  require('crypto').randomBytes(bytes).toString('hex')

// ─── 1. createStudentProfile ─────────────────────────────────────────────────
// exports.createStudentProfile = functions.https.onCall(async (data, ctx) => {
exports.createStudentProfile = functions.https.onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Login required.'
      )
    }

    const data = request.data

    if (request.auth.uid !== data.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'UID mismatch.'
      )
    }

    const { uid, email, firstName, middleName, surname, year, branch, roll } = data
    const rollNo = Number(roll)

    if (!Number.isInteger(rollNo) || rollNo < 1 || rollNo > 300) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Roll number must be between 1 and 300. Got: ${roll}`
      )
    }

    const dup = await db.collection('users')
      .where('year', '==', year)
      .where('branch', '==', branch)
      .where('roll', '==', rollNo)
      .limit(1)
      .get()

    if (!dup.empty) {
      throw new functions.https.HttpsError(
        'already-exists',
        `Roll ${rollNo} is already taken in ${year}-${branch}.`
      )
    }

    const counter = await nextCounter('studentCounter')
    const systemId = `STU-${pad(counter)}`
    const rollNumber = `${year}-${branch}${pad(rollNo, 3)}`

    await db.doc(`users/${uid}`).set({
      role: 'student',
      firstName,
      middleName: middleName || '',
      surname,
      email,
      phone: '',
      systemId,
      rollNumber,
      year,
      branch,
      roll: rollNo,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { systemId, rollNumber }
  }
)

// ─── 4. rotateLectureQR ──────────────────────────────────────────────────────
exports.rotateLectureQR = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  const { lectureId } = data
  const ref    = db.doc(`lectures/${lectureId}`)
  const snap   = await ref.get()
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Lecture not found.')
  if (snap.data().teacherUid !== ctx.auth.uid) throw new functions.https.HttpsError('permission-denied', 'Not your lecture.')

  const qrToken     = randomToken()
  const qrExpiresAt = Date.now() + QR_TTL_MS
  await ref.update({ qrToken, qrExpiresAt })
  return { qrToken, qrExpiresAt }
})

// ─── 5. endLecture ───────────────────────────────────────────────────────────
exports.endLecture = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  const { lectureId } = data
  const ref   = db.doc(`lectures/${lectureId}`)
  const snap  = await ref.get()
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Lecture not found.')
  if (snap.data().teacherUid !== ctx.auth.uid) throw new functions.https.HttpsError('permission-denied', 'Not your lecture.')
  await ref.update({ active: false, qrToken: null, endedAt: admin.firestore.FieldValue.serverTimestamp() })
  return { success: true }
})

// ─── 6. generateWebAuthnChallenge ────────────────────────────────────────────
// @simplewebauthn/server is required lazily here so a load error in this
// package cannot break the student/teacher profile or attendance functions.
exports.generateWebAuthnChallenge = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  const {
    generateRegistrationOptions,
    generateAuthenticationOptions,
  } = require('@simplewebauthn/server')

  const uid      = ctx.auth.uid
  const { type } = data

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
    const allowCredentials = devSnap.docs.map((d) => ({
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
  const { verifyRegistrationResponse } = require('@simplewebauthn/server')

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
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { success: true }
})

// ─── 8. verifyAttendance — the core triple-layer check ───────────────────────
exports.verifyAttendance = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  const { verifyAuthenticationResponse } = require('@simplewebauthn/server')

  const uid = ctx.auth.uid
  const { lectureId, locationLat, locationLng, qrToken, webauthnResponse } = data

  // Load lecture
  const lectureSnap = await db.doc(`lectures/${lectureId}`).get()
  if (!lectureSnap.exists) throw new functions.https.HttpsError('not-found', 'Lecture not found.')
  const lecture = lectureSnap.data()
  if (!lecture.active) throw new functions.https.HttpsError('failed-precondition', 'This session has ended.')

  // Duplicate guard
  const existing = await db.doc(`lectures/${lectureId}/attendance/${uid}`).get()
  if (existing.exists) throw new functions.https.HttpsError('already-exists', 'Attendance already marked.')

  // Layer 1: GPS
  const dist = metres(locationLat, locationLng, lecture.locationLat, lecture.locationLng)
  if (dist > lecture.radius) {
    throw new functions.https.HttpsError('out-of-range', `You are ${Math.round(dist)}m away (limit: ${lecture.radius}m).`)
  }

  // Layer 2: QR token
  if (qrToken !== lecture.qrToken) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid QR code. Scan the latest code.')
  }
  if (Date.now() > lecture.qrExpiresAt) {
    throw new functions.https.HttpsError('deadline-exceeded', 'QR code expired. Scan the latest code.')
  }

  // Layer 3: WebAuthn
  const challengeSnap = await db.collection('webauthn_challenges')
    .where('uid', '==', uid).where('type', '==', 'authentication').where('used', '==', false)
    .orderBy('expiresAt', 'desc').limit(1).get()
  if (challengeSnap.empty) throw new functions.https.HttpsError('not-found', 'No passkey challenge found.')

  const challengeDoc           = challengeSnap.docs[0]
  const { challenge, expiresAt } = challengeDoc.data()
  if (Date.now() > expiresAt) throw new functions.https.HttpsError('deadline-exceeded', 'Challenge expired.')

  const credentialId = webauthnResponse.id
  const passkeyDoc   = await db.doc(`passkeys/${uid}/devices/${credentialId}`).get()
  if (!passkeyDoc.exists) throw new functions.https.HttpsError('not-found', 'Passkey not registered.')

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

  await passkeyDoc.ref.update({ counter: result.authenticationInfo.newCounter })
  await challengeDoc.ref.update({ used: true })

  // Record atomically
  const studentSnap = await db.doc(`users/${uid}`).get()
  const student     = studentSnap.data()
  const batch       = db.batch()

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
  return { success: true, systemId: student.systemId, rollNumber: student.rollNumber, subject: lecture.subject, lectureName: lecture.lectureName, timestamp: new Date().toISOString() }
})

// ─── 9. exportAttendanceCSV ───────────────────────────────────────────────────
exports.exportAttendanceCSV = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.')
  const { lectureId } = data
  const lecture = await db.doc(`lectures/${lectureId}`).get()
  if (!lecture.exists) throw new functions.https.HttpsError('not-found', 'Lecture not found.')
  if (lecture.data().teacherUid !== ctx.auth.uid) throw new functions.https.HttpsError('permission-denied', 'Not your lecture.')

  const rows = await db.collection(`lectures/${lectureId}/attendance`).get()
  const csv  = [
    ['System ID', 'Roll Number', 'Timestamp', 'Distance (m)', 'Verified'],
    ...rows.docs.map((d) => {
      const r = d.data()
      return [r.systemId, r.rollNumber, r.timestamp?.toDate().toISOString() ?? '', r.distanceMetres ?? '', r.verified ? 'Yes' : 'No']
    }),
  ].map((r) => r.join(',')).join('\n')

  const filePath = `exports/${ctx.auth.uid}/${lectureId}.csv`
  const file     = storage.bucket().file(filePath)
  await file.save(csv, { contentType: 'text/csv' })
  const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 15 * 60 * 1000 })
  return { url }
})

// ─── 10. promoteRollNumbers — runs July 1 each year ──────────────────────────
exports.promoteRollNumbers = onSchedule(
  { schedule: '0 0 1 7 *', timeZone: 'Asia/Kolkata' },
  async () => {
    const MAP  = { FE: 'SE', SE: 'TE', TE: 'BE' }
    const snap = await db.collection('users')
      .where('role', '==', 'student').where('year', 'in', ['FE', 'SE', 'TE']).get()
    const batch = db.batch()
    snap.docs.forEach((d) => {
      const { year, branch, roll } = d.data()
      const newYear = MAP[year]
      batch.update(d.ref, { year: newYear, rollNumber: `${newYear}-${branch}${pad(roll, 3)}` })
    })
    await batch.commit()
    console.log(`Promoted ${snap.size} students.`)
  }
)
