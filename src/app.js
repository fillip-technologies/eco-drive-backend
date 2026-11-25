import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRoutes from './routes/authRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

const app = express()

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

// Only trust X-Forwarded-For when actually behind a reverse proxy (Nginx, Render,
// Railway…). Trusting it otherwise lets clients fake their IP and dodge rate limits.
// Set TRUST_PROXY=1 in production when there is exactly one proxy in front.
app.set('trust proxy', Number(process.env.TRUST_PROXY) || false)
app.disable('x-powered-by')
app.use(helmet())
app.use(
  cors({
    // Only listed origins get CORS headers; browsers block every other site.
    // Requests without an Origin header (curl, server-to-server) are unaffected.
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  })
)
app.use(express.json({ limit: '20kb' }))

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/contacts', contactRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
