import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

export async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Not authenticated' })

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
  } catch {
    return res.status(401).json({ message: 'Session expired, please log in again' })
  }

  const admin = await Admin.findById(payload.id)
  if (!admin) return res.status(401).json({ message: 'Admin account no longer exists' })
  if (admin.changedPasswordAfter(payload.iat)) {
    return res.status(401).json({ message: 'Password was changed, please log in again' })
  }

  req.admin = admin
  next()
}
