import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { initializeApp } from 'firebase/app'
import { collection, doc, getFirestore, writeBatch } from 'firebase/firestore'

const envPath = process.env.MIGRATION_ENV || 'scripts/migrate.env'
dotenv.config({ path: envPath })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in migration env')
  process.exit(1)
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
}

if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  console.error('Missing Firebase config in migration env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})
const firebaseApp = initializeApp(firebaseConfig)
const firestore = getFirestore(firebaseApp)

const BATCH_LIMIT = 450

function chunkArray(items, size) {
  const chunks = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

async function commitBatches(ops) {
  const chunks = chunkArray(ops, BATCH_LIMIT)
  for (const chunk of chunks) {
    const batch = writeBatch(firestore)
    chunk.forEach(({ ref, data }) => batch.set(ref, data))
    await batch.commit()
  }
}

async function fetchAll(table) {
  const { data, error } = await supabase.from(table).select('*')
  if (error) throw error
  return data || []
}

async function migrate() {
  console.log('Starting migration...')

  const [
    athleteProfiles,
    sessions,
    groups,
    sets,
    raceRecords,
    trainingRecords,
    strengthRecords,
    injuries,
    monthlyStats
  ] = await Promise.all([
    fetchAll('athlete_profile'),
    fetchAll('training_sessions'),
    fetchAll('workout_groups'),
    fetchAll('workout_sets'),
    fetchAll('race_records'),
    fetchAll('training_records'),
    fetchAll('strength_records'),
    fetchAll('injury_history'),
    fetchAll('monthly_stats')
  ])

  const sessionById = new Map(sessions.map((s) => [s.id, s]))
  const groupById = new Map(groups.map((g) => [g.id, g]))

  const ops = []

  if (athleteProfiles[0]) {
    const profile = athleteProfiles[0]
    ops.push({
      ref: doc(firestore, 'athlete_profile', 'default'),
      data: { ...profile, source_id: profile.id }
    })
  }

  sessions.forEach((session) => {
    const { id, ...rest } = session
    ops.push({
      ref: doc(firestore, 'training_sessions', String(id)),
      data: { ...rest, source_id: id }
    })
  })

  groups.forEach((group) => {
    const session = sessionById.get(group.session_id)
    const sessionId = String(group.session_id)
    const groupRef = doc(
      firestore,
      'training_sessions',
      sessionId,
      'workout_groups',
      String(group.id)
    )
    ops.push({
      ref: groupRef,
      data: {
        ...group,
        source_id: group.id,
        session_date: session?.date || null,
        session_type: session?.type || null
      }
    })
  })

  sets.forEach((set) => {
    const group = groupById.get(set.group_id)
    const sessionId = String(group?.session_id || '')
    if (!sessionId) return
    const setRef = doc(
      firestore,
      'training_sessions',
      sessionId,
      'workout_groups',
      String(set.group_id),
      'workout_sets',
      String(set.id)
    )
    const session = sessionById.get(group.session_id)
    ops.push({
      ref: setRef,
      data: {
        ...set,
        source_id: set.id,
        session_id: group.session_id,
        session_date: session?.date || null,
        session_type: session?.type || null,
        group_name: group?.name || null
      }
    })
  })

  raceRecords.forEach((record) => {
    const { id, ...rest } = record
    ops.push({
      ref: doc(firestore, 'race_records', String(id)),
      data: { ...rest, source_id: id }
    })
  })

  trainingRecords.forEach((record) => {
    const { id, ...rest } = record
    ops.push({
      ref: doc(firestore, 'training_records', String(id)),
      data: { ...rest, source_id: id }
    })
  })

  strengthRecords.forEach((record) => {
    const { id, ...rest } = record
    ops.push({
      ref: doc(firestore, 'strength_records', String(id)),
      data: { ...rest, source_id: id }
    })
  })

  injuries.forEach((record) => {
    const { id, ...rest } = record
    ops.push({
      ref: doc(firestore, 'injury_history', String(id)),
      data: { ...rest, source_id: id }
    })
  })

  monthlyStats.forEach((record) => {
    const { id, ...rest } = record
    ops.push({
      ref: doc(firestore, 'monthly_stats', String(id)),
      data: { ...rest, source_id: id }
    })
  })

  console.log(`Writing ${ops.length} docs to Firestore...`)
  await commitBatches(ops)
  console.log('Migration completed.')
}

migrate().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
