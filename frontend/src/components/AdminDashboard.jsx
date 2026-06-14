import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSurvey } from '../hooks/useSurvey'
import { DISTRICTS, RISK_CATEGORIES, LD_HIERARCHY } from '../config/districts'

const TARGET = 3494

/* ── helpers ──────────────────────────────────────────────── */

function fmt(n)    { return Number(n ?? 0).toLocaleString('en-IN') }
function fmtRs(n)  { return (n != null && n !== '') ? `₹${fmt(n)}` : '—' }
function arrStr(v) { return Array.isArray(v) && v.length ? v.join(', ') : '—' }
function val(v)    { return (v != null && v !== '') ? v : null }

function buildPageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

const RISK_BADGE = {
  High:   'bg-red-100 text-red-700 border border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  Low:    'bg-green-100 text-green-700 border border-green-200',
}

/* ── Multi-section column definitions (complete) ──────────── */

const MULTI_SECTION_DEF = {
  '1': {
    label: 'Basic Info', short: 'S1',
    activeClass: 'bg-blue-100 text-blue-700 border-blue-300',
    groupClass:  'bg-blue-50 text-blue-700 border-blue-100',
    cols: [
      { label: 'District',       cls: 'text-left px-3 py-2 whitespace-nowrap' },
      { label: 'Block',          cls: 'text-left px-3 py-2 whitespace-nowrap' },
      { label: 'Gram Panchayat', cls: 'text-left px-3 py-2' },
      { label: 'Village',        cls: 'text-left px-3 py-2' },
      { label: 'SHG Name',       cls: 'text-left px-3 py-2' },
      { label: 'SHG Code',       cls: 'text-left px-3 py-2' },
      { label: 'Mobile',         cls: 'text-left px-3 py-2 whitespace-nowrap' },
      { label: 'Category',       cls: 'text-left px-3 py-2 whitespace-nowrap' },
      { label: 'HH Size',        cls: 'text-right px-3 py-2' },
      { label: 'Earners',        cls: 'text-right px-3 py-2' },
    ],
  },
  '2': {
    label: 'Income', short: 'S2',
    activeClass: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    groupClass:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    cols: [
      { label: 'FY 24-25',      cls: 'text-right px-3 py-2 whitespace-nowrap' },
      { label: 'FY 25-26',      cls: 'text-right px-3 py-2 whitespace-nowrap' },
      { label: 'Decline ₹',    cls: 'text-right px-3 py-2 whitespace-nowrap' },
      { label: 'Decline %',    cls: 'text-right px-3 py-2' },
      { label: 'Income Sources',cls: 'text-left px-3 py-2' },
      { label: 'Top Decline',  cls: 'text-left px-3 py-2' },
    ],
  },
  '3': {
    label: 'Decline Reasons', short: 'S3',
    activeClass: 'bg-red-100 text-red-700 border-red-300',
    groupClass:  'bg-red-50 text-red-700 border-red-100',
    cols: [
      { label: 'A.1 Prod↓',   cls: 'text-center px-3 py-2' },
      { label: 'A · Reasons', cls: 'text-left px-3 py-2' },
      { label: 'B.1 Mkt↓',   cls: 'text-center px-3 py-2' },
      { label: 'B · Reasons', cls: 'text-left px-3 py-2' },
      { label: 'B.2 Price↓',  cls: 'text-center px-3 py-2' },
      { label: 'C.1 Cap↓',   cls: 'text-center px-3 py-2' },
      { label: 'C.2 Fund',    cls: 'text-center px-3 py-2' },
      { label: 'C · Reasons', cls: 'text-left px-3 py-2' },
      { label: 'C.3 Loan',    cls: 'text-right px-3 py-2' },
      { label: 'D.1 Records', cls: 'text-left px-3 py-2' },
      { label: 'D.2 Skills↓', cls: 'text-center px-3 py-2' },
      { label: 'D · Areas',   cls: 'text-left px-3 py-2' },
      { label: 'E · Factors', cls: 'text-left px-3 py-2' },
      { label: 'F · Factors', cls: 'text-left px-3 py-2' },
    ],
  },
  '4': {
    label: 'Support Recv.', short: 'S4',
    activeClass: 'bg-purple-100 text-purple-700 border-purple-300',
    groupClass:  'bg-purple-50 text-purple-700 border-purple-100',
    cols: [
      { label: 'Received',     cls: 'text-left px-3 py-2' },
      { label: 'Others',       cls: 'text-left px-3 py-2' },
    ],
  },
  '5': {
    label: 'Support Req.', short: 'S5',
    activeClass: 'bg-orange-100 text-orange-700 border-orange-300',
    groupClass:  'bg-orange-50 text-orange-700 border-orange-100',
    cols: [
      { label: 'High Priority',   cls: 'text-left px-3 py-2' },
      { label: 'Medium Priority', cls: 'text-left px-3 py-2' },
      { label: 'Low Priority',    cls: 'text-left px-3 py-2' },
    ],
  },
  '6': {
    label: 'Restoration', short: 'S6',
    activeClass: 'bg-teal-100 text-teal-700 border-teal-300',
    groupClass:  'bg-teal-50 text-teal-700 border-teal-100',
    cols: [
      { label: 'Possible', cls: 'text-center px-3 py-2' },
      { label: 'Remarks',  cls: 'text-left px-3 py-2' },
    ],
  },
  '7': {
    label: 'BMMU Assessment', short: 'S7',
    activeClass: 'bg-amber-100 text-amber-700 border-amber-300',
    groupClass:  'bg-amber-50 text-amber-700 border-amber-100',
    cols: [
      { label: 'Risk',          cls: 'text-center px-3 py-2' },
      { label: 'Primary Reason',cls: 'text-left px-3 py-2' },
      { label: 'Secondary',     cls: 'text-left px-3 py-2' },
      { label: 'Intervention',  cls: 'text-left px-3 py-2' },
      { label: 'Enumerator',    cls: 'text-left px-3 py-2' },
      { label: 'Designation',   cls: 'text-left px-3 py-2' },
      { label: 'Survey Date',   cls: 'text-left px-3 py-2 whitespace-nowrap' },
    ],
  },
}

const DEFAULT_SECTIONS = ['1', '2', '7']

/* ── single-survey CSV download ──────────────────────────── */

function downloadSingleCSV(survey) {
  const dr = survey.decline_reasons
    ? (typeof survey.decline_reasons === 'string' ? JSON.parse(survey.decline_reasons) : survey.decline_reasons)
    : {}
  const sr = survey.support_required
    ? (typeof survey.support_required === 'string' ? JSON.parse(survey.support_required) : survey.support_required)
    : {}

  const srFlat = {}
  Object.entries(sr).forEach(([k, v]) => { srFlat[`Support Required: ${k}`] = v || '' })
  const a = v => Array.isArray(v) ? v.join('; ') : (v || '')

  const row = {
    'District': survey.district || '', 'Block': survey.block || '',
    'Gram Panchayat': survey.gram_panchayat || '', 'Village': survey.village || '',
    'LD Name': survey.ld_name || '', 'LD Code': survey.ld_code || '',
    'SHG Name': survey.shg_name || '', 'SHG Code': survey.shg_code || '',
    'Mobile': survey.mobile || '', 'Social Category': survey.social_category || '',
    'Household Size': survey.household_size ?? '', 'Earning Members': survey.earning_members ?? '',
    'Income FY 2024-25 (Rs.)': survey.income_2425 ?? '',
    'Income FY 2025-26 (Rs.)': survey.income_2526 ?? '',
    'Decline Amount (Rs.)': survey.income_decline_amount ?? '',
    'Decline %': survey.income_decline_pct ?? '',
    'Income Sources': a(survey.income_sources),
    'Highest Decline Source': survey.highest_decline_source || '',
    'A.1 Production Reduced': dr.dr_a_produced_reduced || '',
    'A - Reasons': a(dr.dr_a_reasons), 'A - Others': dr.dr_a_others || '',
    'B.1 Mkt Difficulty': dr.dr_b_mkt_difficulty || '',
    'B - Reasons': a(dr.dr_b_reasons), 'B - Others': dr.dr_b_others || '',
    'B.2 Lower Price': dr.dr_b_lower_price || '',
    'C.1 Needed Working Capital': dr.dr_c_need_working_cap || '',
    'C.2 Adequate Fund': dr.dr_c_adequate_fund || '',
    'C - Financial Reasons': a(dr.dr_c_reasons), 'C - Others': dr.dr_c_others || '',
    'C.3 Outstanding Loan (Rs.)': dr.dr_c_outstanding_loan ?? '',
    'D.1 Business Records': dr.dr_d_records || '',
    'D.2 Skills Affected Income': dr.dr_d_skills_affected || '',
    'D - Skill Areas': a(dr.dr_d_skill_areas), 'D - Others': dr.dr_d_others || '',
    'E.1 Personal/Family Factors': a(dr.dr_e_factors), 'E - Others': dr.dr_e_others || '',
    'F.1 External Factors': a(dr.dr_f_factors), 'F - Others': dr.dr_f_others || '',
    'Support Received': a(survey.support_received),
    'Support Received (Other)': survey.support_received_other || '',
    ...srFlat,
    'Restoration Possible': survey.restoration_possible || '',
    'Restoration Remarks': survey.restoration_remarks || '',
    'Risk Category': survey.risk_category || '',
    'Primary Reason': survey.primary_reason || '',
    'Secondary Reason': survey.secondary_reason || '',
    'Recommended Intervention': survey.recommended_intervention || '',
    'Enumerator Name': survey.enumerator_name || '',
    'Designation': survey.designation || '',
    'Survey Date': survey.survey_date || '',
    'Submitted At': survey.created_at || '',
  }

  const esc = v => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + Object.keys(row).join(',') + '\n' + Object.values(row).map(esc).join(',')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Survey_${(survey.ld_code || survey.ld_name || 'export').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link); link.click(); link.remove()
  URL.revokeObjectURL(url)
}

/* ── modal primitives ─────────────────────────────────────── */

function Row({ label, value }) {
  if (!val(value) && value !== 0) return null
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 w-40 shrink-0 pt-px">{label}</span>
      <span className="text-xs text-gray-800 font-semibold break-words min-w-0">{String(value)}</span>
    </div>
  )
}

function Chip({ text, color = 'bg-gray-100 text-gray-600' }) {
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${color} mr-1 mb-1`}>{text}</span>
}

function ModalSection({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-700 bg-slate-50 border-l-4 border-teal-500 px-3 py-1.5 rounded-r-lg mb-2">{title}</p>
      <div className="px-1">{children}</div>
    </div>
  )
}

function YesNoBadge({ value }) {
  if (!value) return <span className="text-gray-300 text-xs">—</span>
  const color = value === 'Yes' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{value}</span>
}

/* ── decline reasons block ────────────────────────────────── */

function DeclineReasonsPanel({ dr }) {
  if (!dr) return <p className="text-xs text-gray-400 italic px-1 py-2">Not recorded</p>
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-gray-600 mb-1.5">A. Production Issues</p>
        <div className="bg-gray-50 rounded-xl px-3 py-1">
          <div className="flex gap-3 py-2 border-b border-gray-100"><span className="text-xs text-gray-400 w-44 shrink-0">Production reduced?</span><YesNoBadge value={dr.dr_a_produced_reduced} /></div>
          {dr.dr_a_produced_reduced === 'Yes' && <>
            <div className="py-2 border-b border-gray-100"><p className="text-xs text-gray-400 mb-1">Reasons</p><div>{(dr.dr_a_reasons || []).map((r, i) => <Chip key={i} text={r} color="bg-red-50 text-red-700" />)}</div></div>
            {dr.dr_a_others && <Row label="Others" value={dr.dr_a_others} />}
          </>}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-600 mb-1.5">B. Marketing Issues</p>
        <div className="bg-gray-50 rounded-xl px-3 py-1">
          <div className="flex gap-3 py-2 border-b border-gray-100"><span className="text-xs text-gray-400 w-44 shrink-0">Difficulty selling?</span><YesNoBadge value={dr.dr_b_mkt_difficulty} /></div>
          {dr.dr_b_mkt_difficulty === 'Yes' && Array.isArray(dr.dr_b_reasons) && dr.dr_b_reasons.length > 0 && <div className="py-2 border-b border-gray-100"><p className="text-xs text-gray-400 mb-1">Reasons</p><div>{dr.dr_b_reasons.map((r, i) => <Chip key={i} text={r} color="bg-amber-50 text-amber-700" />)}</div></div>}
          {dr.dr_b_others && <Row label="Others" value={dr.dr_b_others} />}
          <div className="flex gap-3 py-2"><span className="text-xs text-gray-400 w-44 shrink-0">Sold at lower price?</span><YesNoBadge value={dr.dr_b_lower_price} /></div>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-600 mb-1.5">C. Financial Issues</p>
        <div className="bg-gray-50 rounded-xl px-3 py-1">
          <div className="flex gap-3 py-2 border-b border-gray-100"><span className="text-xs text-gray-400 w-44 shrink-0">Needed working capital?</span><YesNoBadge value={dr.dr_c_need_working_cap} /></div>
          {dr.dr_c_need_working_cap === 'Yes' && <>
            <div className="flex gap-3 py-2 border-b border-gray-100"><span className="text-xs text-gray-400 w-44 shrink-0">Received adequate fund?</span><YesNoBadge value={dr.dr_c_adequate_fund} /></div>
            {dr.dr_c_adequate_fund === 'No' && Array.isArray(dr.dr_c_reasons) && dr.dr_c_reasons.length > 0 && <div className="py-2 border-b border-gray-100"><p className="text-xs text-gray-400 mb-1">Source of difficulty</p><div>{dr.dr_c_reasons.map((r, i) => <Chip key={i} text={r} color="bg-orange-50 text-orange-700" />)}</div></div>}
            {dr.dr_c_others && <Row label="Others" value={dr.dr_c_others} />}
            {dr.dr_c_outstanding_loan != null && <Row label="Outstanding Loan" value={fmtRs(dr.dr_c_outstanding_loan)} />}
          </>}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-600 mb-1.5">D. Enterprise Management</p>
        <div className="bg-gray-50 rounded-xl px-3 py-1">
          <Row label="Business records" value={dr.dr_d_records} />
          <div className="flex gap-3 py-2 border-b border-gray-100"><span className="text-xs text-gray-400 w-44 shrink-0">Skills affected income?</span><YesNoBadge value={dr.dr_d_skills_affected} /></div>
          {dr.dr_d_skills_affected === 'Yes' && Array.isArray(dr.dr_d_skill_areas) && dr.dr_d_skill_areas.length > 0 && <div className="py-2 border-b border-gray-100"><p className="text-xs text-gray-400 mb-1">Areas needing support</p><div>{dr.dr_d_skill_areas.map((r, i) => <Chip key={i} text={r} color="bg-indigo-50 text-indigo-700" />)}</div></div>}
          {dr.dr_d_others && <Row label="Others" value={dr.dr_d_others} />}
        </div>
      </div>
      {Array.isArray(dr.dr_e_factors) && dr.dr_e_factors.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-600 mb-1.5">E. Personal / Family Factors</p>
          <div className="bg-gray-50 rounded-xl px-3 py-2"><div>{dr.dr_e_factors.map((r, i) => <Chip key={i} text={r} color="bg-purple-50 text-purple-700" />)}</div>{dr.dr_e_others && <p className="text-xs text-gray-600 mt-1">Others: {dr.dr_e_others}</p>}</div>
        </div>
      )}
      {Array.isArray(dr.dr_f_factors) && dr.dr_f_factors.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-600 mb-1.5">F. External Factors</p>
          <div className="bg-gray-50 rounded-xl px-3 py-2"><div>{dr.dr_f_factors.map((r, i) => <Chip key={i} text={r} color="bg-pink-50 text-pink-700" />)}</div>{dr.dr_f_others && <p className="text-xs text-gray-600 mt-1">Others: {dr.dr_f_others}</p>}</div>
        </div>
      )}
    </div>
  )
}

/* ── Survey detail MODAL ─────────────────────────────────── */

function SurveyDetailModal({ survey, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!survey) return null
  const dr = survey.decline_reasons ? (typeof survey.decline_reasons === 'string' ? JSON.parse(survey.decline_reasons) : survey.decline_reasons) : null
  const sr = survey.support_required ? (typeof survey.support_required === 'string' ? JSON.parse(survey.support_required) : survey.support_required) : null
  const srEntries = sr && typeof sr === 'object' && !Array.isArray(sr) ? Object.entries(sr).filter(([, v]) => v) : []
  const priorityColor = { High: 'bg-red-50 text-red-700', Medium: 'bg-amber-50 text-amber-700', Low: 'bg-green-50 text-green-700' }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col my-4 max-h-[calc(100vh-2rem)] overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Fixed header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 gap-3 bg-white rounded-t-2xl shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Full Survey Record</p>
            <p className="text-base font-extrabold text-gray-900 mt-0.5 truncate">{survey.ld_name}</p>
            <p className="text-xs text-gray-400 font-mono">{survey.ld_code || '—'} · {survey.district}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1 flex-wrap justify-end">
            {survey.risk_category && <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${RISK_BADGE[survey.risk_category] ?? 'bg-gray-100 text-gray-600'}`}>{survey.risk_category} Risk</span>}
            <button onClick={() => downloadSingleCSV(survey)} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">↓ CSV</button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-xl">×</button>
          </div>
        </div>

        {/* Scrollable 2-column body */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0">

            {/* LEFT — survey data */}
            <div className="space-y-5">
              <ModalSection title="Section 1 — Basic Information">
                <div className="bg-gray-50 rounded-xl px-3 py-1">
                  <Row label="LD Name" value={survey.ld_name} /><Row label="LD Code" value={survey.ld_code} />
                  <Row label="SHG Name" value={survey.shg_name} /><Row label="SHG Code" value={survey.shg_code} />
                  <Row label="District" value={survey.district} /><Row label="Block" value={survey.block} />
                  <Row label="Gram Panchayat" value={survey.gram_panchayat} /><Row label="Village" value={survey.village} />
                  <Row label="Mobile" value={survey.mobile} /><Row label="Social Category" value={survey.social_category} />
                  <Row label="Household Size" value={survey.household_size} /><Row label="Earning Members" value={survey.earning_members} />
                </div>
              </ModalSection>
              <ModalSection title="Section 2 — Income Details">
                <div className="bg-gray-50 rounded-xl px-3 py-1">
                  <Row label="Income FY 2024-25" value={fmtRs(survey.income_2425)} />
                  <Row label="Income FY 2025-26" value={fmtRs(survey.income_2526)} />
                  <Row label="Decline Amount" value={fmtRs(survey.income_decline_amount)} />
                  <Row label="Decline %" value={survey.income_decline_pct != null ? `${survey.income_decline_pct}%` : null} />
                  <Row label="Income Sources" value={arrStr(survey.income_sources)} />
                  <Row label="Highest Decline From" value={survey.highest_decline_source} />
                </div>
              </ModalSection>
              <ModalSection title="Section 3 — Reason for Income Decline">
                <DeclineReasonsPanel dr={dr} />
              </ModalSection>
            </div>

            {/* RIGHT — assessment & support */}
            <div className="space-y-5">
              <ModalSection title="Section 7 — BMMU Assessment">
                <div className="bg-gray-50 rounded-xl px-3 py-1">
                  <div className="flex gap-3 py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-400 w-40 shrink-0">Risk Category</span>
                    {survey.risk_category ? <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${RISK_BADGE[survey.risk_category] ?? ''}`}>{survey.risk_category}</span> : <span className="text-gray-300 text-xs">—</span>}
                  </div>
                  <Row label="Primary Reason" value={survey.primary_reason} />
                  <Row label="Secondary Reason" value={survey.secondary_reason} />
                  <Row label="Recommended Action" value={survey.recommended_intervention} />
                  <Row label="Enumerator Name" value={survey.enumerator_name} />
                  <Row label="Designation" value={survey.designation} />
                  <Row label="Survey Date" value={survey.survey_date} />
                </div>
              </ModalSection>
              <ModalSection title="Section 4 — Support Received (FY 2025-26)">
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                  {Array.isArray(survey.support_received) && survey.support_received.length > 0
                    ? <div>{survey.support_received.map((s, i) => <Chip key={i} text={s} color="bg-blue-50 text-blue-700" />)}</div>
                    : <p className="text-xs text-gray-400 italic">None recorded</p>}
                  {survey.support_received_other && <p className="text-xs text-gray-600 mt-2">Others: {survey.support_received_other}</p>}
                </div>
              </ModalSection>
              <ModalSection title="Section 5 — Support Required">
                {srEntries.length > 0 ? (
                  <div className="bg-gray-50 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-gray-100"><th className="text-left px-3 py-2 font-semibold text-gray-600">Intervention</th><th className="text-center px-3 py-2 font-semibold text-gray-600 w-24">Priority</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {srEntries.map(([k, v]) => <tr key={k}><td className="px-3 py-2 text-gray-700">{k}</td><td className="px-3 py-2 text-center"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${priorityColor[v] ?? 'bg-gray-100 text-gray-600'}`}>{v}</span></td></tr>)}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-xs text-gray-400 italic px-1 py-2">Not recorded</p>}
              </ModalSection>
              <ModalSection title="Section 6 — Restoration">
                <div className="bg-gray-50 rounded-xl px-3 py-1">
                  <div className="flex gap-3 py-2 border-b border-gray-100"><span className="text-xs text-gray-400 w-40 shrink-0">Restoration Possible?</span><YesNoBadge value={survey.restoration_possible} /></div>
                  <Row label="Remarks" value={survey.restoration_remarks} />
                </div>
              </ModalSection>
            </div>

          </div>
          <p className="text-xs text-gray-400 text-center pb-5">
            Submitted: {survey.created_at ? new Date(survey.created_at).toLocaleString('en-IN') : '—'}
          </p>
        </div>

      </div>
    </div>
  )
}

/* ── Multi-section table cells (complete) ────────────────── */

function MultiSectionCells({ s, sections }) {
  const dr = s.decline_reasons ? (typeof s.decline_reasons === 'string' ? JSON.parse(s.decline_reasons) : s.decline_reasons) : {}
  const sr = s.support_required ? (typeof s.support_required === 'string' ? JSON.parse(s.support_required) : s.support_required) : {}

  const ynBadge = v => {
    if (!v) return <span className="text-gray-300 text-xs">—</span>
    const c = v === 'Yes' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
    return <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${c}`}>{v}</span>
  }

  const mini = (v, cls = 'text-gray-600') => (
    <p className={`text-xs truncate max-w-[130px] ${cls}`}>{v || '—'}</p>
  )

  const declinePct = s.income_decline_pct != null
    ? `${Number(s.income_decline_pct).toFixed(1)}%`
    : (s.income_2425 > 0 ? `${(((s.income_2425 - s.income_2526) / s.income_2425) * 100).toFixed(1)}%` : '—')

  const srEntries = Object.entries(sr)
  const highItems   = srEntries.filter(([, v]) => v === 'High').map(([k]) => k)
  const medItems    = srEntries.filter(([, v]) => v === 'Medium').map(([k]) => k)
  const lowItems    = srEntries.filter(([, v]) => v === 'Low').map(([k]) => k)

  const cells = []
  sections.forEach(sec => {
    switch (sec) {
      case '1': cells.push(
        <td key="1-dist"    className="px-3 py-3 text-xs text-gray-700 font-medium whitespace-nowrap">{s.district}</td>,
        <td key="1-block"   className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{s.block || '—'}</td>,
        <td key="1-gp"      className="px-3 py-3 text-xs text-gray-500 max-w-[110px]">{mini(s.gram_panchayat)}</td>,
        <td key="1-village" className="px-3 py-3 text-xs text-gray-500 max-w-[90px]">{mini(s.village)}</td>,
        <td key="1-shgn"    className="px-3 py-3 text-xs text-gray-600 max-w-[120px]">{mini(s.shg_name)}</td>,
        <td key="1-shgc"    className="px-3 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">{s.shg_code || '—'}</td>,
        <td key="1-mob"     className="px-3 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">{s.mobile || '—'}</td>,
        <td key="1-cat"     className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{s.social_category || '—'}</td>,
        <td key="1-hh"      className="px-3 py-3 text-right text-xs text-gray-600">{s.household_size ?? '—'}</td>,
        <td key="1-earn"    className="px-3 py-3 text-right text-xs text-gray-600">{s.earning_members ?? '—'}</td>,
      ); break
      case '2': cells.push(
        <td key="2-2425"  className="px-3 py-3 text-right text-xs text-gray-600 whitespace-nowrap">{fmtRs(s.income_2425)}</td>,
        <td key="2-2526"  className="px-3 py-3 text-right text-xs text-gray-600 whitespace-nowrap">{fmtRs(s.income_2526)}</td>,
        <td key="2-amt"   className="px-3 py-3 text-right text-xs text-gray-700 whitespace-nowrap">{fmtRs(s.income_decline_amount)}</td>,
        <td key="2-pct"   className="px-3 py-3 text-right"><span className="text-red-600 font-bold text-xs">{declinePct}</span></td>,
        <td key="2-src"   className="px-3 py-3 text-xs text-gray-500 max-w-[140px]">{mini(arrStr(s.income_sources))}</td>,
        <td key="2-top"   className="px-3 py-3 text-xs text-gray-500 max-w-[120px]">{mini(s.highest_decline_source)}</td>,
      ); break
      case '3': cells.push(
        <td key="3-a1"   className="px-3 py-3 text-center">{ynBadge(dr.dr_a_produced_reduced)}</td>,
        <td key="3-ar"   className="px-3 py-3 text-xs text-gray-500 max-w-[130px]">{mini(arrStr(dr.dr_a_reasons))}</td>,
        <td key="3-b1"   className="px-3 py-3 text-center">{ynBadge(dr.dr_b_mkt_difficulty)}</td>,
        <td key="3-br"   className="px-3 py-3 text-xs text-gray-500 max-w-[130px]">{mini(arrStr(dr.dr_b_reasons))}</td>,
        <td key="3-b2"   className="px-3 py-3 text-center">{ynBadge(dr.dr_b_lower_price)}</td>,
        <td key="3-c1"   className="px-3 py-3 text-center">{ynBadge(dr.dr_c_need_working_cap)}</td>,
        <td key="3-c2"   className="px-3 py-3 text-center">{ynBadge(dr.dr_c_adequate_fund)}</td>,
        <td key="3-cr"   className="px-3 py-3 text-xs text-gray-500 max-w-[130px]">{mini(arrStr(dr.dr_c_reasons))}</td>,
        <td key="3-c3"   className="px-3 py-3 text-right text-xs text-gray-600 whitespace-nowrap">{dr.dr_c_outstanding_loan ? fmtRs(dr.dr_c_outstanding_loan) : '—'}</td>,
        <td key="3-d1"   className="px-3 py-3 text-xs text-gray-600 max-w-[100px]">{mini(dr.dr_d_records)}</td>,
        <td key="3-d2"   className="px-3 py-3 text-center">{ynBadge(dr.dr_d_skills_affected)}</td>,
        <td key="3-da"   className="px-3 py-3 text-xs text-gray-500 max-w-[130px]">{mini(arrStr(dr.dr_d_skill_areas))}</td>,
        <td key="3-ef"   className="px-3 py-3 text-xs text-gray-500 max-w-[130px]">{mini(arrStr(dr.dr_e_factors))}</td>,
        <td key="3-ff"   className="px-3 py-3 text-xs text-gray-500 max-w-[130px]">{mini(arrStr(dr.dr_f_factors))}</td>,
      ); break
      case '4': cells.push(
        <td key="4-recv"  className="px-3 py-3 text-xs text-gray-600 max-w-[160px]">{mini(arrStr(s.support_received))}</td>,
        <td key="4-oth"   className="px-3 py-3 text-xs text-gray-500 max-w-[120px]">{mini(s.support_received_other)}</td>,
      ); break
      case '5': cells.push(
        <td key="5-h"  className="px-3 py-3 text-xs text-red-600 max-w-[150px]">{highItems.length ? <p className="truncate">{highItems.join(', ')}</p> : <span className="text-gray-300">—</span>}</td>,
        <td key="5-m"  className="px-3 py-3 text-xs text-amber-600 max-w-[150px]">{medItems.length  ? <p className="truncate">{medItems.join(', ')}</p>  : <span className="text-gray-300">—</span>}</td>,
        <td key="5-l"  className="px-3 py-3 text-xs text-green-600 max-w-[150px]">{lowItems.length  ? <p className="truncate">{lowItems.join(', ')}</p>  : <span className="text-gray-300">—</span>}</td>,
      ); break
      case '6': cells.push(
        <td key="6-r"   className="px-3 py-3 text-center">{ynBadge(s.restoration_possible)}</td>,
        <td key="6-rem" className="px-3 py-3 text-xs text-gray-500 max-w-[160px]">{mini(s.restoration_remarks)}</td>,
      ); break
      case '7': cells.push(
        <td key="7-risk" className="px-3 py-3 text-center">
          {s.risk_category ? <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${RISK_BADGE[s.risk_category] ?? 'bg-gray-100 text-gray-600'}`}>{s.risk_category}</span> : <span className="text-gray-300">—</span>}
        </td>,
        <td key="7-pri"  className="px-3 py-3 text-xs text-gray-600 max-w-[130px]">{mini(s.primary_reason)}</td>,
        <td key="7-sec"  className="px-3 py-3 text-xs text-gray-500 max-w-[130px]">{mini(s.secondary_reason)}</td>,
        <td key="7-int"  className="px-3 py-3 text-xs text-gray-500 max-w-[140px]">{mini(s.recommended_intervention)}</td>,
        <td key="7-enum" className="px-3 py-3 text-xs font-medium text-gray-700 max-w-[120px]">{mini(s.enumerator_name, 'text-gray-700')}</td>,
        <td key="7-des"  className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{s.designation || '—'}</td>,
        <td key="7-date" className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{s.survey_date || '—'}</td>,
      ); break
    }
  })
  return cells
}

/* ── Stat card (reference-style) ─────────────────────────── */

function StatCard({ label, value, sub, iconBg, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none">{fmt(value)}</p>
      {sub && <p className="text-[11px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">{sub}</p>}
    </div>
  )
}

/* ── Pagination ───────────────────────────────────────────── */

function Pagination({ page, totalPages, onChange, className = '' }) {
  if (totalPages <= 1) return null
  const pages = buildPageWindow(page, totalPages)
  return (
    <div className={`flex items-center justify-center gap-1 flex-wrap ${className}`}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">←</button>
      {pages.map((p, i) =>
        p === '...' ? <span key={`e${i}`} className="px-2 text-gray-400">…</span> : (
          <button key={p} onClick={() => onChange(p)}
            className={`w-9 h-9 text-sm rounded-lg border transition-colors ${p === page ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 hover:bg-gray-50'}`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">→</button>
    </div>
  )
}

/* ── SVG Icons ────────────────────────────────────────────── */

const IconGrid = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
const IconCalendar = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
const IconAlert = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
const IconActivity = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
const IconShield = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>

/* ── Main dashboard ──────────────────────────────────────── */

const EMPTY_FILTERS = { district: '', block: '', risk_category: '', search: '', sections: DEFAULT_SECTIONS }

export default function AdminDashboard() {
  const { fetchSurveys, fetchStats, exportSurveys, surveys, totalCount, stats, loading, error, PAGE_SIZE } = useSurvey()
  const navigate = useNavigate()

  const [activeTab, setActiveTab]    = useState('overview')
  const [filters, setFilters]        = useState(EMPTY_FILTERS)
  const [appliedFilters, setApplied] = useState(EMPTY_FILTERS)
  const [page, setPage]              = useState(1)
  const [selected, setSelected]      = useState(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const pct        = Math.min(100, Math.round((stats.total / TARGET) * 100))
  const blocks     = filters.district ? Object.keys(LD_HIERARCHY[filters.district] || {}).sort() : []

  useEffect(() => { fetchSurveys({}, 1); fetchStats({}) }, [])
  useEffect(() => { setFilters(f => ({ ...f, block: '' })) }, [filters.district])

  const toApiFilters = f => Object.fromEntries(
    [['district', f.district], ['block', f.block], ['risk_category', f.risk_category], ['search', f.search]]
      .filter(([, v]) => v)
  )

  const applyFilters = useCallback(() => {
    const next = { ...filters }
    setApplied(next); setPage(1)
    fetchSurveys(toApiFilters(next), 1)
  }, [filters, fetchSurveys])

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(1)
    fetchSurveys({}, 1); fetchStats({})
  }

  const handlePageChange = p => {
    setPage(p); fetchSurveys(toApiFilters(appliedFilters), p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleSection = sec => setFilters(f => {
    const active = f.sections.includes(sec)
    const next = active ? f.sections.filter(s => s !== sec) : [...f.sections, sec].sort()
    return { ...f, sections: next.length ? next : f.sections }
  })

  const user = (() => { try { return JSON.parse(localStorage.getItem('ld_user')) } catch { return null } })()
  const hasApiFilter = ['district', 'block', 'risk_category', 'search'].some(k => appliedFilters[k])

  return (
    <div className="min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <img src="/asrlm_logo.png" alt="ASRLM" className="h-9 w-9 object-contain shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-extrabold text-gray-900 leading-tight">Admin Dashboard</h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">ASRLM · Lakhpati Didi Income Decline Survey</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {user && <span className="hidden sm:block text-xs text-gray-500">Signed in as <span className="font-semibold text-gray-700">{user.name}</span></span>}
            <button onClick={() => { localStorage.removeItem('ld_token'); localStorage.removeItem('ld_user'); navigate('/login') }}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors font-medium">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">

        {/* ── Tab switcher ── */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 shadow-sm p-1 w-fit mb-5">
          {[
            { id: 'overview',  label: 'Overview' },
            { id: 'responses', label: 'Responses', count: stats.total },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {tab.label}
              {tab.count != null && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>{fmt(tab.count)}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW ══ */}
        {activeTab === 'overview' && (
          <div className="space-y-4">

            {/* Coverage */}
            <div className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4 sm:pb-5">
                <div className="flex items-center justify-between mb-4 sm:mb-5 gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700 leading-snug">
                    <span className="hidden sm:inline">Lakhpati Didi Survey Progress · FY 2025-26 · ASRLM</span>
                    <span className="sm:hidden">LD Survey Progress · FY 2025-26</span>
                  </p>
                  <span className="shrink-0 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">{pct}% complete</span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                  {[
                    { label: 'Surveyed',  value: stats.total,                       highlight: true },
                    { label: 'Target',    value: TARGET,                            highlight: false },
                    { label: 'Remaining', value: Math.max(0, TARGET - stats.total), highlight: false },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className={`rounded-xl px-3 sm:px-5 py-3 sm:py-4 ${highlight ? 'bg-teal-600' : 'bg-gray-50'}`}>
                      <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-1.5 ${highlight ? 'text-teal-100' : 'text-gray-400'}`}>{label}</p>
                      <p className={`font-extrabold leading-none ${highlight ? 'text-white text-2xl sm:text-4xl lg:text-5xl' : 'text-gray-700 text-xl sm:text-3xl lg:text-4xl'}`}>
                        {fmt(value)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="h-3 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.max(pct > 0 ? 2 : 0, pct)}%`, background: 'linear-gradient(90deg, #4ade80, #22c55e)' }} />
                  </div>
                  <span className="text-teal-700 text-xl font-extrabold shrink-0 w-14 text-right">{pct}%</span>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard label="Total Surveys"  value={stats.total}  sub="All submitted"          iconBg="bg-slate-100 text-slate-600"  icon={<IconGrid />} />
              <StatCard label="Surveyed Today" value={stats.today}  sub="Last 24 hours"          iconBg="bg-blue-100 text-blue-600"    icon={<IconCalendar />} />
              <StatCard label="High Risk"      value={stats.high}   sub="Need urgent action"     iconBg="bg-red-100 text-red-600"      icon={<IconAlert />} />
              <StatCard label="Medium Risk"    value={stats.medium} sub="Need follow-up"         iconBg="bg-amber-100 text-amber-600"  icon={<IconActivity />} />
              <StatCard label="Low Risk"       value={stats.low}    sub="Stable livelihoods"     iconBg="bg-green-100 text-green-600"  icon={<IconShield />} />
            </div>

          </div>
        )}

        {/* ══ RESPONSES ══ */}
        {activeTab === 'responses' && (
          <div className="space-y-4">

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Filter Responses</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <input value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && applyFilters()}
                  placeholder="Search LD name…"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-all" />
                <select value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-all">
                  <option value="">All Districts</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={filters.block} onChange={e => setFilters(f => ({ ...f, block: e.target.value }))}
                  disabled={!filters.district}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-all disabled:opacity-50">
                  <option value="">All Blocks</option>
                  {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filters.risk_category} onChange={e => setFilters(f => ({ ...f, risk_category: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-all">
                  <option value="">All Risk Levels</option>
                  {RISK_CATEGORIES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={applyFilters}
                    className="flex-1 bg-slate-800 text-white rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm">Apply</button>
                  <button onClick={clearFilters}
                    className="border border-gray-200 text-gray-600 rounded-xl px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors">Clear</button>
                </div>
              </div>

              {/* Section toggles */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Show Columns</p>
                  <button onClick={() => setFilters(f => ({ ...f, sections: Object.keys(MULTI_SECTION_DEF) }))}
                    className="text-[10px] font-semibold text-teal-600 hover:underline">All</button>
                  <span className="text-gray-300 text-xs">·</span>
                  <button onClick={() => setFilters(f => ({ ...f, sections: DEFAULT_SECTIONS }))}
                    className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 hover:underline">Reset</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(MULTI_SECTION_DEF).map(([sec, def]) => {
                    const active = filters.sections.includes(sec)
                    return (
                      <button key={sec} onClick={() => toggleSection(sec)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${active ? def.activeClass : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`}>
                        {def.short} · {def.label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Column changes apply when you click <span className="font-bold text-gray-500">Apply</span></p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex-wrap gap-2">
                <div>
                  <span className="text-sm font-extrabold text-gray-900">{fmt(totalCount)} Response{totalCount !== 1 ? 's' : ''}</span>
                  {totalCount > 0 && <span className="text-xs text-gray-400 ml-2 font-medium hidden sm:inline">— page {page} of {totalPages} · 20 per page</span>}
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs text-gray-400 hidden sm:block">{appliedFilters.sections.map(s => MULTI_SECTION_DEF[s]?.short).join(' + ')}</span>
                  <button onClick={() => exportSurveys(toApiFilters(appliedFilters), 'csv', '')}
                    disabled={!totalCount}
                    className="bg-teal-600 text-white rounded-xl px-3 sm:px-4 py-2 text-xs font-bold hover:bg-teal-700 transition-colors disabled:opacity-40 shadow-sm">
                    ↓ Export CSV
                  </button>
                </div>
              </div>

              {!loading && surveys.length > 0 && (
                <div className="px-4 sm:px-5 py-2.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-xs text-gray-400 text-center sm:text-left">
                    Rows {fmt((page - 1) * PAGE_SIZE + 1)}–{fmt(Math.min(page * PAGE_SIZE, totalCount))} of {fmt(totalCount)}
                  </p>
                  <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-b border-red-100 text-red-700 text-sm px-5 py-3 flex items-center gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mr-3" />
                  <span className="text-sm">Loading surveys…</span>
                </div>
              ) : surveys.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-sm font-medium">No surveys found</p>
                  {hasApiFilter && <button onClick={clearFilters} className="mt-2 text-xs text-teal-600 underline">Clear filters</button>}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th rowSpan={2} className="sticky left-0 z-20 bg-gray-50 border-r border-gray-200 text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap min-w-[170px]">
                            LD Name / Code
                          </th>
                          {appliedFilters.sections.map(sec => (
                            <th key={sec} colSpan={MULTI_SECTION_DEF[sec].cols.length}
                              className={`text-center px-3 py-2 text-xs font-bold uppercase tracking-wide border-x ${MULTI_SECTION_DEF[sec].groupClass}`}>
                              {MULTI_SECTION_DEF[sec].short} · {MULTI_SECTION_DEF[sec].label}
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {appliedFilters.sections.flatMap(sec =>
                            MULTI_SECTION_DEF[sec].cols.map(({ label, cls }) => (
                              <th key={`${sec}-${label}`} className={`${cls} text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50`}>{label}</th>
                            ))
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {surveys.map(s => (
                          <tr key={s.id} onClick={() => setSelected(s)}
                            className="hover:bg-teal-50 cursor-pointer transition-colors group">
                            <td className="sticky left-0 z-10 bg-white group-hover:bg-teal-50 transition-colors border-r border-gray-100 px-4 py-3 min-w-[170px]">
                              <p className="font-semibold text-gray-900 truncate max-w-[155px] group-hover:text-teal-700 transition-colors text-sm">{s.ld_name}</p>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{s.ld_code || '—'}</p>
                            </td>
                            <MultiSectionCells s={s} sections={appliedFilters.sections} />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 sm:px-5 py-4 border-t border-gray-100">
                    <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} className="mt-0" />
                    <p className="text-xs text-gray-400 text-center mt-2">
                      Rows {fmt((page - 1) * PAGE_SIZE + 1)}–{fmt(Math.min(page * PAGE_SIZE, totalCount))} of {fmt(totalCount)}
                    </p>
                  </div>
                </>
              )}
            </div>

          </div>
        )}

        <p className="text-center text-xs text-gray-400 py-5">ASRLM · Lakhpati Didi Income Decline Assessment · Admin View</p>
      </div>

      {selected && <SurveyDetailModal survey={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
