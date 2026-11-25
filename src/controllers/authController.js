import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import Admin from '../models/Admin.js'

const signToken = (admin) =>
  jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  })

// Compared against when the email is unknown, so a failed login takes the same
// time whether or not the account exists (prevents email enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12)

const publicAdmin = (admin) => ({ id: admin._id, name: admin.name, email: admin.email })

// POST /api/auth/login
export async function login(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

  const admin = await Admin.findOne({ email }).select('+password')
  const valid = admin ? await admin.comparePassword(password) : await bcrypt.compare(password, DUMMY_HASH)
  if (!admin || !valid) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  admin.lastLoginAt = new Date()
  await admin.save()

  res.json({ token: signToken(admin), admin: publicAdmin(admin) })
}

// GET /api/auth/me
export function me(req, res) {
  res.json({ admin: publicAdmin(req.admin) })
}

// PATCH /api/auth/password
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' })
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' })
  }

  const admin = await Admin.findById(req.admin._id).select('+password')
  if (!(await admin.comparePassword(String(currentPassword)))) {
    return res.status(401).json({ message: 'Current password is incorrect' })
  }
  admin.password = String(newPassword)
  await admin.save() // also sets passwordChangedAt, which invalidates older tokens

  // Hand back a fresh token so the current session stays logged in
  res.json({ message: 'Password updated', token: signToken(admin) })
}
