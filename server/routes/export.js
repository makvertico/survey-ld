const express = require('express')
const ExcelJS = require('exceljs')
const pool = require('../db/pool')
const { requireAdmin } = require('../middleware/auth')

const EXPORT_ROW_CAP = 50_000

const router = express.Router()

const ALL_COLS = `
  id, district, block, gram_panchayat, village,
  ld_name, ld_code, shg_name, shg_code, mobile, social_category,
  household_size, earning_members,
  income_2425, income_2526, income_decline_amount, income_decline_pct,
  income_sources, highest_decline_source,
  decline_reasons,
  support_received, support_received_other, support_required,
  restoration_possible, restoration_remarks,
  risk_category, primary_reason, secondary_reason,
  recommended_intervention, enumerator_name, designation,
  survey_date, created_at
`

const SECTION_COLS = {
  '1': `id, district, block, gram_panchayat, village, ld_name, ld_code, shg_name, shg_code, mobile, social_category, household_size, earning_members`,
  '2': `id, district, ld_name, ld_code, income_2425, income_2526, income_decline_amount, income_decline_pct, income_sources, highest_decline_source`,
  '3': `id, district, ld_name, ld_code, decline_reasons`,
  '4': `id, district, ld_name, ld_code, support_received, support_received_other`,
  '5': `id, district, ld_name, ld_code, support_required`,
  '6': `id, district, ld_name, ld_code, restoration_possible, restoration_remarks`,
  '7': `id, district, ld_name, ld_code, risk_category, primary_reason, secondary_reason, recommended_intervention, enumerator_name, designation, survey_date, created_at`,
}

function buildWhere(query) {
  const conditions = []
  const params = []
  if (query.district)      { params.push(query.district);      conditions.push(`district = $${params.length}`) }
  if (query.block)         { params.push(query.block);         conditions.push(`block = $${params.length}`) }
  if (query.risk_category) { params.push(query.risk_category); conditions.push(`risk_category = $${params.length}`) }
  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params }
}

function arr(v) { return Array.isArray(v) ? v.join('; ') : (v || '') }

function flattenRow(s, section) {
  const dr = s.decline_reasons || {}
  const sr = s.support_required || {}

  switch (section) {
    case '1': return {
      District: s.district, Block: s.block, 'Gram Panchayat': s.gram_panchayat, Village: s.village,
      'LD Name': s.ld_name, 'LD Code': s.ld_code, 'SHG Name': s.shg_name, 'SHG Code': s.shg_code,
      Mobile: s.mobile, 'Social Category': s.social_category,
      'Household Size': s.household_size, 'Earning Members': s.earning_members,
    }
    case '2': return {
      District: s.district, 'LD Name': s.ld_name, 'LD Code': s.ld_code,
      'Income FY 2024-25 (Rs.)': s.income_2425, 'Income FY 2025-26 (Rs.)': s.income_2526,
      'Decline Amount (Rs.)': s.income_decline_amount, 'Decline %': s.income_decline_pct,
      'Income Sources': arr(s.income_sources), 'Highest Decline Source': s.highest_decline_source,
    }
    case '3': return {
      District: s.district, 'LD Name': s.ld_name, 'LD Code': s.ld_code,
      'A.1 Production Reduced': dr.dr_a_produced_reduced || '',
      'A - Reasons': arr(dr.dr_a_reasons), 'A - Others': dr.dr_a_others || '',
      'B.1 Mkt Difficulty': dr.dr_b_mkt_difficulty || '',
      'B - Reasons': arr(dr.dr_b_reasons), 'B - Others': dr.dr_b_others || '',
      'B.2 Lower Price': dr.dr_b_lower_price || '',
      'C.1 Needed Working Capital': dr.dr_c_need_working_cap || '',
      'C.2 Adequate Fund': dr.dr_c_adequate_fund || '',
      'C - Financial Reasons': arr(dr.dr_c_reasons), 'C - Others': dr.dr_c_others || '',
      'C.3 Outstanding Loan (Rs.)': dr.dr_c_outstanding_loan ?? '',
      'D.1 Business Records': dr.dr_d_records || '',
      'D.2 Skills Affected': dr.dr_d_skills_affected || '',
      'D - Skill Areas': arr(dr.dr_d_skill_areas), 'D - Others': dr.dr_d_others || '',
      'E.1 Personal/Family Factors': arr(dr.dr_e_factors), 'E - Others': dr.dr_e_others || '',
      'F.1 External Factors': arr(dr.dr_f_factors), 'F - Others': dr.dr_f_others || '',
    }
    case '4': return {
      District: s.district, 'LD Name': s.ld_name, 'LD Code': s.ld_code,
      'Support Received': arr(s.support_received), 'Support Received (Other)': s.support_received_other || '',
    }
    case '5': {
      const srFlat = {}
      Object.entries(sr).forEach(([k, v]) => { srFlat[k] = v || '' })
      return { District: s.district, 'LD Name': s.ld_name, 'LD Code': s.ld_code, ...srFlat }
    }
    case '6': return {
      District: s.district, 'LD Name': s.ld_name, 'LD Code': s.ld_code,
      'Restoration Possible': s.restoration_possible || '', 'Restoration Remarks': s.restoration_remarks || '',
    }
    case '7': return {
      District: s.district, 'LD Name': s.ld_name, 'LD Code': s.ld_code,
      'Risk Category': s.risk_category || '', 'Primary Reason': s.primary_reason || '',
      'Secondary Reason': s.secondary_reason || '', 'Recommended Intervention': s.recommended_intervention || '',
      'Enumerator Name': s.enumerator_name || '', 'Designation': s.designation || '',
      'Survey Date': s.survey_date || '', 'Submitted At': s.created_at || '',
    }
    default: return {
      District: s.district, Block: s.block, 'Gram Panchayat': s.gram_panchayat, Village: s.village,
      'LD Name': s.ld_name, 'LD Code': s.ld_code, 'SHG Name': s.shg_name, 'SHG Code': s.shg_code,
      Mobile: s.mobile, 'Social Category': s.social_category,
      'Household Size': s.household_size, 'Earning Members': s.earning_members,
      'Income FY 2024-25 (Rs.)': s.income_2425, 'Income FY 2025-26 (Rs.)': s.income_2526,
      'Decline Amount (Rs.)': s.income_decline_amount, 'Decline %': s.income_decline_pct,
      'Income Sources': arr(s.income_sources), 'Highest Decline Source': s.highest_decline_source,
      'A.1 Production Reduced': dr.dr_a_produced_reduced || '',
      'B.1 Mkt Difficulty': dr.dr_b_mkt_difficulty || '',
      'B.2 Lower Price': dr.dr_b_lower_price || '',
      'C.1 Working Capital': dr.dr_c_need_working_cap || '',
      'C.2 Adequate Fund': dr.dr_c_adequate_fund || '',
      'C.3 Outstanding Loan (Rs.)': dr.dr_c_outstanding_loan ?? '',
      'D.1 Business Records': dr.dr_d_records || '',
      'D.2 Skills Affected': dr.dr_d_skills_affected || '',
      'Support Received': arr(s.support_received), 'Support Received (Other)': s.support_received_other || '',
      'Restoration Possible': s.restoration_possible || '', 'Restoration Remarks': s.restoration_remarks || '',
      'Risk Category': s.risk_category || '', 'Primary Reason': s.primary_reason || '',
      'Secondary Reason': s.secondary_reason || '', 'Recommended Intervention': s.recommended_intervention || '',
      'Enumerator Name': s.enumerator_name || '', 'Designation': s.designation || '',
      'Survey Date': s.survey_date || '', 'Submitted At': s.created_at || '',
    }
  }
}

function toCSV(rows) {
  if (!rows.length) return '﻿'
  const esc = v => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  const headers = Object.keys(rows[0])
  return '﻿' + [
    headers.join(','),
    ...rows.map(r => headers.map(h => esc(r[h])).join(',')),
  ].join('\r\n')
}

// GET /api/export/csv  — section-aware CSV export
router.get('/csv', requireAdmin, async (req, res) => {
  const section = req.query.section || ''
  const cols = SECTION_COLS[section] || ALL_COLS
  const { where, params } = buildWhere(req.query)

  try {
    const { rows } = await pool.query(
      `SELECT ${cols} FROM surveys ${where} ORDER BY created_at DESC LIMIT ${EXPORT_ROW_CAP}`,
      params
    )

    const sectionLabel = section ? `_Section${section}` : '_AllSections'
    const filename = `LD_Survey${sectionLabel}_${new Date().toISOString().slice(0, 10)}.csv`

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.send(toCSV(rows.map(r => flattenRow(r, section))))
  } catch (err) {
    console.error('CSV export error:', err)
    res.status(500).json({ error: 'Export failed' })
  }
})

// GET /api/export/xlsx  — full Excel export (all columns)
router.get('/xlsx', requireAdmin, async (req, res) => {
  const { where, params } = buildWhere(req.query)
  try {
    const { rows } = await pool.query(
      `SELECT ${ALL_COLS} FROM surveys ${where} ORDER BY created_at DESC LIMIT ${EXPORT_ROW_CAP}`,
      params
    )

    const flatRows = rows.map(r => flattenRow(r, ''))
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Surveys')

    if (flatRows.length > 0) {
      sheet.columns = Object.keys(flatRows[0]).map(key => ({ header: key, key, width: 20 }))
      sheet.addRows(flatRows)
      // Bold header row
      sheet.getRow(1).font = { bold: true }
    }

    const filename = `LD_Survey_${new Date().toISOString().slice(0, 10)}.xlsx`
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    const buffer = await workbook.xlsx.writeBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
    console.error('XLSX export error:', err)
    res.status(500).json({ error: 'Export failed' })
  }
})

module.exports = router
