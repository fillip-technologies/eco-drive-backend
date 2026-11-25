import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, me, changePassword } from '../controllers/authController.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// Slow down password guessing: 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
})

router.post('/login', loginLimiter, login)
router.get('/me', requireAdmin, me)
router.patch('/password', requireAdmin, changePassword)

export default router
