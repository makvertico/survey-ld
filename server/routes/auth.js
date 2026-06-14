const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db/pool')
const { requireAdmin } = require('../middleware/auth')

const router = express.Router()

// POST /api/auth/login  — { email, password } required
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, district, password FROM enumerators WHERE email = $1 AND active = TRUE',
      [email.toLowerCase().trim()]
    )

    const user = rows[0]
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, district: user.district },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    )

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, district: user.district },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/auth/register  — admin only; role is always 'enumerator'
router.post('/register', requireAdmin, async (req, res) => {
  const { name, email, password, designation, district } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' })
  }

  try {
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      `INSERT INTO enumerators (name, email, password, designation, district, role)
       VALUES ($1, $2, $3, $4, $5, 'enumerator')
       RETURNING id, name, email, role`,
      [name, email.toLowerCase().trim(), hash, designation || null, district || null]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' })
    }
    console.error('Register error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
