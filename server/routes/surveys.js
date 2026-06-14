const express = require('express')
const rateLimit = require('express-rate-limit')
const pool = require('../db/pool')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()
const PAGE_SIZE = 20

const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions from this IP. Please wait a minute before trying again.' },
})

// GET /api/surveys/surveyed-codes — PUBLIC, no auth required
// Returns ld_codes that already have a submitted survey in a given district/block
router.get('/surveyed-codes', async (req, res) => {
  const { district, block } = req.query
  if (!district) return res.status(400).json({ error: 'district is required' })

  try {
    const params = [district]
    let query = 'SELECT ld_code FROM surveys WHERE district = $1 AND ld_code IS NOT NULL'
    if (block) { params.push(block); query += ` AND block = $${params.length}` }

    const { rows } = await pool.query(query, params)
    res.json({ codes: rows.map(r => r.ld_code) })
  } catch (err) {
    console.error('surveyed-codes error:', err)
    res.status(500).json({ error: 'Failed to fetch surveyed codes' })
  }
})

// POST /api/surveys  — submit a survey (public — enumerator info collected in form)
router.post('/', submitLimiter, async (req, res) => {
  const d = req.body

  // Block duplicate submissions for the same LD
  if (d.ld_code) {
    try {
      const dup = await pool.query(
        'SELECT id, enumerator_name, survey_date FROM surveys WHERE ld_code = $1 LIMIT 1',
        [d.ld_code]
      )
      if (dup.rows.length > 0) {
        return res.status(409).json({
          error: 'A survey for this Lakhpati Didi already exists. Please contact your supervisor if a correction is needed.',
        })
      }
    } catch (err) {
      console.error('Duplicate check error:', err)
    }
  }

  // Package all Section 3 (Decline Reasons) flat fields into one JSONB object
  const decline_reasons = JSON.stringify({
    dr_a_produced_reduced: d.dr_a_produced_reduced || null,
    dr_a_reasons:          Array.isArray(d.dr_a_reasons)     ? d.dr_a_reasons     : [],
    dr_a_others:           d.dr_a_others           || null,
    dr_b_mkt_difficulty:   d.dr_b_mkt_difficulty   || null,
    dr_b_reasons:          Array.isArray(d.dr_b_reasons)     ? d.dr_b_reasons     : [],
    dr_b_others:           d.dr_b_others           || null,
    dr_b_lower_price:      d.dr_b_lower_price      || null,
    dr_c_need_working_cap: d.dr_c_need_working_cap || null,
    dr_c_adequate_fund:    d.dr_c_adequate_fund    || null,
    dr_c_reasons:          Array.isArray(d.dr_c_reasons)     ? d.dr_c_reasons     : [],
    dr_c_others:           d.dr_c_others           || null,
    dr_c_outstanding_loan: d.dr_c_outstanding_loan != null ? Number(d.dr_c_outstanding_loan) : null,
    dr_d_records:          d.dr_d_records          || null,
    dr_d_skills_affected:  d.dr_d_skills_affected  || null,
    dr_d_skill_areas:      Array.isArray(d.dr_d_skill_areas) ? d.dr_d_skill_areas : [],
    dr_d_others:           d.dr_d_others           || null,
    dr_e_factors:          Array.isArray(d.dr_e_factors)     ? d.dr_e_factors     : [],
    dr_e_others:           d.dr_e_others           || null,
    dr_f_factors:          Array.isArray(d.dr_f_factors)     ? d.dr_f_factors     : [],
    dr_f_others:           d.dr_f_others           || null,
  })

  try {
    await pool.query(
      `INSERT INTO surveys (
        district, block, gram_panchayat, village,
        ld_name, ld_code, shg_name, shg_code, mobile, social_category,
        household_size, earning_members,
        income_2425, income_2526,
        income_sources, income_sources_other, highest_decline_source,
        decline_reasons, support_received, support_received_other,
        support_required, restoration_possible, restoration_remarks,
        risk_category, primary_reason, secondary_reason,
        recommended_intervention, enumerator_name, designation, survey_date
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
        $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30
      )`,
      [
        d.district, d.block || null, d.gram_panchayat || null, d.village || null,
        d.ld_name, d.ld_code || null, d.shg_name || null, d.shg_code || null,
        d.mobile || null, d.social_category || null,
        d.household_size || null, d.earning_members || null,
        parseFloat(d.income_2425) || 0, parseFloat(d.income_2526) || 0,
        d.income_sources?.length ? d.income_sources : null,
        d.income_sources_other || null,
        d.highest_decline_source || null,
        decline_reasons,
        d.support_received?.length ? d.support_received : null,
        d.support_received_other || null,
        d.support_required ? JSON.stringify(d.support_required) : null,
        d.restoration_possible || null,
        d.restoration_remarks || null,
        d.risk_category || null,
        d.primary_reason || null, d.secondary_reason || null,
        Array.isArray(d.recommended_interventions) ? d.recommended_interventions.join(', ') : (d.recommended_intervention || null),
        d.enumerator_name || null, d.designation || null,
        d.survey_date || null,
      ]
    )

    res.status(201).json({ success: true })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A survey for this Lakhpati Didi already exists.' })
    }
    console.error('Survey insert error:', err)
    res.status(500).json({ error: 'Failed to save survey' })
  }
})

// GET /api/surveys  — paginated list (admin only)
router.get('/', requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const conditions = []
  const params = []

  if (req.query.district) {
    params.push(req.query.district)
    conditions.push(`district = $${params.length}`)
  }
  if (req.query.block) {
    params.push(req.query.block)
    conditions.push(`block = $${params.length}`)
  }
  if (req.query.risk_category) {
    params.push(req.query.risk_category)
    conditions.push(`risk_category = $${params.length}`)
  }
  if (req.query.search) {
    params.push(`%${req.query.search}%`)
    conditions.push(`ld_name ILIKE $${params.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT id, district, block, gram_panchayat, village,
                ld_name, ld_code, shg_name, shg_code,
                mobile, social_category, household_size, earning_members,
                income_2425, income_2526, income_decline_amount, income_decline_pct,
                income_sources, income_sources_other, highest_decline_source,
                decline_reasons,
                support_received, support_received_other, support_required,
                restoration_possible, restoration_remarks,
                risk_category, primary_reason, secondary_reason,
                recommended_intervention,
                enumerator_name, designation, survey_date, created_at
         FROM surveys ${where}
         ORDER BY created_at DESC
         LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
        params
      ),
      pool.query(`SELECT COUNT(*) FROM surveys ${where}`, params),
    ])

    res.json({
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page,
      page_size: PAGE_SIZE,
    })
  } catch (err) {
    console.error('Surveys fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch surveys' })
  }
})

// GET /api/surveys/stats  — aggregate counts (admin only)
router.get('/stats', requireAdmin, async (req, res) => {
  const conditions = []
  const params = []

  if (req.query.district) { params.push(req.query.district); conditions.push(`district = $${params.length}`) }
  if (req.query.block) { params.push(req.query.block); conditions.push(`block = $${params.length}`) }
  if (req.query.risk_category) { params.push(req.query.risk_category); conditions.push(`risk_category = $${params.length}`) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    const [summaryRes, districtRes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)                                                        AS total,
           COUNT(*) FILTER (WHERE risk_category = 'High')                 AS high,
           COUNT(*) FILTER (WHERE risk_category = 'Medium')               AS medium,
           COUNT(*) FILTER (WHERE risk_category = 'Low')                  AS low,
           COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)        AS today
         FROM surveys ${where}`,
        params
      ),
      // District breakdown is always global (no filter) — for the analytics chart
      pool.query(
        `SELECT district, COUNT(*) AS count
         FROM surveys
         WHERE district IS NOT NULL
         GROUP BY district
         ORDER BY count DESC
         LIMIT 10`
      ),
    ])

    const r = summaryRes.rows[0]
    res.json({
      total: parseInt(r.total),
      high: parseInt(r.high),
      medium: parseInt(r.medium),
      low: parseInt(r.low),
      today: parseInt(r.today),
      by_district: districtRes.rows.map(row => ({
        district: row.district,
        count: parseInt(row.count),
      })),
    })
  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// GET /api/surveys/:id  — full survey detail (admin only)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM surveys WHERE id = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Survey not found' })
    res.json(rows[0])
  } catch (err) {
    console.error('Survey detail error:', err)
    res.status(500).json({ error: 'Failed to fetch survey' })
  }
})

module.exports = router
