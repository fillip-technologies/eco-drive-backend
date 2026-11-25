// Creates the admin account (or resets its password if it already exists).
// Usage: set ADMIN_EMAIL / ADMIN_PASSWORD in .env, then `npm run seed:admin`
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import Admin from '../models/Admin.js'

const { ADMIN_NAME = 'Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.')
  process.exit(1)
}
if (ADMIN_PASSWORD.length < 8) {
  console.error('ADMIN_PASSWORD must be at least 8 characters.')
  process.exit(1)
}

try {
  await connectDB(process.env.MONGO_URI)
  let admin = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() })
  if (admin) {
    admin.password = ADMIN_PASSWORD
    admin.name = ADMIN_NAME
    await admin.save()
    console.log(`Admin ${admin.email} already existed — password reset.`)
  } else {
    admin = await Admin.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    console.log(`Admin ${admin.email} created.`)
  }
} catch (err) {
  console.error('Seeding failed:', err.message)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
