'use strict'

const admin = require('firebase-admin')
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule }         = require('firebase-functions/v2/scheduler')

admin.initializeApp()
const db      = admin.firestore()
const storage = admin.storage()

// ─── Production URLs ──────────────────────────────────────────────────────────
// These must match the domain where your app is hosted.
// If you add a custom domain later, update both values.
const APP_ORIGIN = 'https://attendify-official.web.app'
const APP_RP_ID  = 'attendify-official.web.app'
// ─────────────────────────────────────────────────────────────────────────────

const QR_TTL_MS        = 30_000   // 30 seconds
const CHALLENGE_TTL_MS = 60_000   // 60 seconds

// ─── Shared options for all callable functions ────────────────────────────────
// cors:true    → allows requests from the browser (fixes CORS preflight)
// invoker:public → sets Cloud Run to "Allow public access" automatically on
//                  deploy, so you don't need to do it manually in Cloud Console
const CALL_OPTS = { cors: true, invoker: 'public' }

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

// ─── 1. createStudentProfile ──────────────────────────────────────────────────
exports.createStudentProfile = onCall(CALL_OPTS, async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'Login required.')

  const { uid, email, firstName, middleName, surname, year, branch, roll } = request.data

  if (request.auth.uid !== uid)
    throw new HttpsError('permission-denied', 'UID mismatch.')

  const rollNo = Number(roll)
  if (!Number.isInteger(rollNo) || rollNo < 1 || rollNo > 300)
    throw new HttpsError('invalid-argument', `Roll number must be 1–300. Got: ${roll}`)

  // Uniqueness check within year + branch
  const dup = await db.collection('users')
    .where('year', '==', year)
    .where('branch', '==', branch)
    .where('roll', '==', rollNo)
    .limit(1).get()
  if (!dup.empty)
    throw new HttpsError('already-exists', `Roll ${rollNo} is already taken in ${year}-${branch}.`)

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
exports.createTeacherProfile = onCall(CALL_OPTS, async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'Login required.')

  const caller = await db.doc(`users/${request.auth.uid}`).get()
  if (!caller.exists || caller.data().role !== 'admin')
    throw new HttpsError('permission-denied', 'Admins only.')

  const { uid, email, firstName, middleName, surname, subjects } = request.data
  const counter  = await nextCounter('teacherCounter')
  const systemId = `TCH-${pad(counter)}`

  await db.doc(`users/${uid}`).set({
    role: 'teacher',
    firstName, middleName: middleName || '', surname,
    email, phone: '', systemId,
    subjects: subjects || [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { systemId }
})

// ─── 3. createLecture ─────────────────────────────────────────────────────────
exports.createLecture = onCall(CALL_OPTS, async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'Login required.')

  const teacher = await db.doc(`users/${request.auth.uid}`).get()
  if (!teacher.exists || teacher.data().role !== 'teacher')
    throw new HttpsError('permission-denied', 'Teachers only.')

  const {
    subject, lectureName, date, startTime, endTime,
    locationLat, locationLng, radius,
  } = request.data

  const qrToken     = randomToken()
  const qrExpiresAt = Date.now() + QR_TTL_MS

  const ref = await db.collection('lectures').add({
    teacherUid:  request.auth.uid,
    teacherName: `${teacher.data().firstName} ${teacher.data().surname}`,
    subject, lectureName, date, startTime, endTime,
    locationLat, locationLng,
    radius: Number(radius) || 50,
    active: true, qrToken, qrExpiresAt,
    attendanceCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { lectureId: ref.id, qrToken, qrExpiresAt }
})

// ─── 4. rotateLectureQR ───────────────────────────────────────────────────────
exports.rotateLectureQR = onCall(CALL_OPTS, async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'Login required.')

  const { lectureId } = request.data
  const ref  = db.doc(`lectures/${lectureId}`)
  const snap = await ref.get()

  if (!snap.exists)
    throw new HttpsError('not-found', 'Lecture not found.')
  if (snap.data().teacherUid !== request.auth.uid)
    throw new HttpsError('permission-denied', 'Not your lecture.')

  const qrToken     = randomToken()
  const qrExpiresAt = Date.now() + QR_TTL_MS
  await ref.update({ qrToken, qrExpiresAt })
  return { qrToken, qrExpiresAt }
})

// ─── 5. endLecture ────────────────────────────────────────────────────────────
exports.endLecture = onCall(CALL_OPTS, async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'Login required.')

  const { lectureId } = request.data
  const ref  = db.doc(`lectures/${lectureId}`)
  const snap = await ref.get()

  if (!snap.exists)
    throw new HttpsError('not-found', 'Lecture not found.')
  if (snap.data().teacherUid !== request.auth.uid)
    throw new HttpsError('permission-denied', 'Not your lecture.')

  await ref.update({
    active: false, qrToken: null,
    endedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { success: true }
})

// ─── 6. generateWebAuthnChallenge ─────────────────────────────────────────────
// @simplewebauthn/server is required lazily so a load error in that package
// cannot take down createStudentProfile or createLecture.
exports.generateWebAuthnChallenge = onCall(CALL_OPTS, async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'Login required.')

  const {
    generateRegistrationOptions,
    generateAuthenticationOptions,
  } = require('@simplewebauthn/server')

  const uid  = request.auth.uid
  const type = request.data.type

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

// ─── 7. verifyWebAuthnRegistration ────────────────────────────────────────────
exports.verifyWebAuthnRegistration = onCall(CALL_OPTS, async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'Login required.')

  const { verifyRegistrationResponse } = require('@simplewebauthn/server')
  const uid = request.auth.uid
  const { response: attResp, deviceName } = request.data

  const snap = await db.collection('webauthn_challenges')
    .where('uid', '==', uid).where('type', '==', 'registration').where('used', '==', false)
    .orderBy('expiresAt', 'desc').limit(1).get()
  if (snap.empty)
    throw new HttpsError('not-found', 'No active challenge.')

  const challengeDoc             = snap.docs[0]
  const { challenge, expiresAt } = challengeDoc.data()
  if (Date.now() > expiresAt)
    throw new HttpsError('deadline-exceeded', 'Challenge expired.')

  const result = await verifyRegistrationResponse({
    response: attResp, expectedChallenge: challenge,
    expectedOrigin: APP_ORIGIN, expectedRPID: APP_RP_ID,
  })
  if (!result.verified)
    throw new HttpsError('invalid-argument', 'Passkey verification failed.')

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

// ─── 8. verifyAttendance — triple-layer check ─────────────────────────────────
exports.verifyAttendance = onCall(CALL_OPTS, async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'Login required.')

  const { verifyAuthenticationResponse } = require('@simplewebauthn/server')
  const uid = request.auth.uid
  const { lectureId, locationLat, locationLng, qrToken, webauthnResponse } = request.data

  // Load lecture
  const lectureSnap = await db.doc(`lectures/${lectureId}`).get()
  if (!lectureSnap.exists) throw new HttpsError('not-found', 'Lecture not found.')
  const lecture = lectureSnap.data()
  if (!lecture.active) throw new HttpsError('failed-precondition', 'Session has ended.')

  // Duplicate guard
  const existing = await db.doc(`lectures/${lectureId}/attendance/${uid}`).get()
  if (existing.exists) throw new HttpsError('already-exists', 'Attendance already marked.')

  // Layer 1: GPS
  const dist = metres(locationLat, locationLng, lecture.locationLat, lecture.locationLng)
  if (dist > lecture.radius)
    throw new HttpsError('out-of-range', `You are ${Math.round(dist)}m away (limit: ${lecture.radius}m).`)

  // Layer 2: QR token
  if (qrToken !== lecture.qrToken)
    throw new HttpsError('invalid-argument', 'Invalid QR code. Scan the latest.')
  if (Date.now() > lecture.qrExpiresAt)
    throw new HttpsError('deadline-exceeded', 'QR code expired. Scan the latest.')

  // Layer 3: WebAuthn
  const challengeSnap = await db.collection('webauthn_challenges')
    .where('uid', '==', uid).where('type', '==', 'authentication').where('used', '==', false)
    .orderBy('expiresAt', 'desc').limit(1).get()
  if (challengeSnap.empty)
    throw new HttpsError('not-found', 'No passkey challenge found.')

  const challengeDoc             = challengeSnap.docs[0]
  const { challenge, expiresAt } = challengeDoc.data()
  if (Date.now() > expiresAt) throw new HttpsError('deadline-exceeded', 'Challenge expired.')

  const credentialId = webauthnResponse.id
  const passkeyDoc   = await db.doc(`passkeys/${uid}/devices/${credentialId}`).get()
  if (!passkeyDoc.exists) throw new HttpsError('not-found', 'Passkey not registered.')

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
  if (!result.verified)
    throw new HttpsError('unauthenticated', 'Passkey authentication failed.')

  await passkeyDoc.ref.update({ counter: result.authenticationInfo.newCounter })
  await challengeDoc.ref.update({ used: true })

  // Record atomically
  const student = (await db.doc(`users/${uid}`).get()).data()
  const batch   = db.batch()

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
exports.exportAttendanceCSV = onCall(CALL_OPTS, async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'Login required.')

  const { lectureId } = request.data
  const lecture = await db.doc(`lectures/${lectureId}`).get()
  if (!lecture.exists) throw new HttpsError('not-found', 'Lecture not found.')
  if (lecture.data().teacherUid !== request.auth.uid)
    throw new HttpsError('permission-denied', 'Not your lecture.')

  const rows = await db.collection(`lectures/${lectureId}/attendance`).get()
  const csv  = [
    ['System ID', 'Roll Number', 'Timestamp', 'Distance (m)', 'Verified'],
    ...rows.docs.map((d) => {
      const r = d.data()
      return [
        r.systemId, r.rollNumber,
        r.timestamp?.toDate().toISOString() ?? '',
        r.distanceMetres ?? '',
        r.verified ? 'Yes' : 'No',
      ]
    }),
  ].map((r) => r.join(',')).join('\n')

  const filePath = `exports/${request.auth.uid}/${lectureId}.csv`
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
