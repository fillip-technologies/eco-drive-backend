import 'dotenv/config'
import app from './app.js'
import { connectDB } from './config/db.js'

const PORT = process.env.PORT || 5050

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.')
  process.exit(1)
}

try {
  await connectDB(process.env.MONGO_URI)
  app.listen(PORT, () => console.log(`Ecodriv API running on http://localhost:${PORT}`))
} catch (err) {
  console.error('Failed to start server:', err.message)
  process.exit(1)
}
