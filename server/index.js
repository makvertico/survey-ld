require('dotenv').config()

const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const authRoutes = require('./routes/auth')
const surveyRoutes = require('./routes/surveys')
const exportRoutes = require('./routes/export')

const app = express()
const PORT = process.env.PORT || 3001

// Security headers
app.use(helmet())

// CORS — in dev allow any localhost port; in prod use CORS_ORIGIN env var
const corsOrigin = process.env.NODE_ENV === 'production'
  ? process.env.CORS_ORIGIN
  : (origin, cb) => cb(null, /^http:\/\/localhost(:\d+)?$/.test(origin || '') || !origin)

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '1mb' }))

// Rate limiting on login to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
})

// Routes
app.use('/api/auth', loginLimiter, authRoutes)
app.use('/api/surveys', surveyRoutes)
app.use('/api/export', exportRoutes)

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// Startup guards — fail loud rather than silently misconfigured
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long')
}
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
  throw new Error('CORS_ORIGIN must be set in production')
}

app.listen(PORT, () => {
  console.log(`LD Survey API running on port ${PORT}`)
})
