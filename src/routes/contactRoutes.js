import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  createContact,
  listContacts,
  contactStats,
  updateContact,
  deleteContact,
} from '../controllers/contactController.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// Basic spam protection for the public form: 20 submissions per hour per IP
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: { message: 'Too many submissions. Please try again later.' },
})

router.post('/', submitLimiter, createContact)

router.get('/', requireAdmin, listContacts)
router.get('/stats', requireAdmin, contactStats)
router.patch('/:id', requireAdmin, updateContact)
router.delete('/:id', requireAdmin, deleteContact)

export default router
