import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/* ── Section metadata + field guides ─────────────────────── */

const SECTIONS = [
  {
    num: '01', tag: 'Section 1', title: 'Basic Information',
    desc: 'District, block, LD identification & household details',
    accent: { card: 'border-blue-200 bg-blue-50', num: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
    fields: [
      { id: '1.1', label: 'District', req: true },
      { id: '1.2', label: 'Block', req: true },
      { id: '1.3', label: 'Gram Panchayat', note: 'optional, narrows LD search' },
      { id: '1.4', label: 'Search & select Lakhpati Didi', req: true },
      { sub: true, label: 'LD Code', auto: true },
      { sub: true, label: 'SHG Name & SHG Code', auto: true },
      { sub: true, label: 'Village', auto: true },
      { sub: true, label: 'Income FY 2024-25 & FY 2025-26', auto: true },
      { id: '1.5', label: 'Mobile Number', req: true, note: '10-digit, starting 6–9' },
      { id: '1.6', label: 'Social Category', req: true, choices: ['SC', 'ST', 'OBC', 'General', 'Tea Garden', 'Others'] },
      { id: '1.7', label: 'Household Size', req: true, note: 'total no. of members' },
      { id: '1.8', label: 'Earning Members', req: true, note: 'members with any income' },
    ],
  },
  {
    num: '02', tag: 'Section 2', title: 'Income Details',
    desc: 'FY 2024-25 vs FY 2025-26 income from ASRLM records',
    accent: { card: 'border-emerald-200 bg-emerald-50', num: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
    fields: [
      { id: '2.1', label: 'Annual Income FY 2024-25 (₹)', auto: true },
      { id: '2.2', label: 'Annual Income FY 2025-26 (₹)', auto: true },
      { id: '2.3 / 2.4', label: 'Decline amount & decline %', auto: true, note: 'computed automatically from above values' },
      { id: '2.5', label: 'Main source(s) of income', req: true, note: 'select all that apply',
        choices: ['Agriculture', 'Livestock', 'Fisheries', 'Handloom', 'Handicrafts', 'Food Processing', 'Petty Trade', 'Service Sector', 'Wage Labour', 'Others'] },
      { sub: true, cond: true, label: 'Specify other income source', req: true },
      { id: '2.6', label: 'Income source with highest decline', req: true, note: 'only from the sources selected above' },
    ],
  },
  {
    num: '03', tag: 'Section 3', title: 'Reason for Decline',
    desc: 'Production, marketing, financial & external factors',
    accent: { card: 'border-red-200 bg-red-50', num: 'bg-red-100 text-red-600', dot: 'bg-red-400' },
    fields: [
      { id: 'A.1', label: 'Did production reduce during FY 2025-26? (Yes / No)', req: true },
      { sub: true, cond: true, label: 'Reasons for production decline', req: true,
        choices: ['Lack of raw materials', 'High input cost', 'Labour shortage', 'Climate / Natural disaster', 'Disease / Pest attack', 'Lack of equipment', 'Lack of Finance', 'Others'] },
      { sub: true, cond: true, label: 'Specify if "Others" selected' },

      { id: 'B.1', label: 'Did you face difficulty selling products/services? (Yes / No)', req: true },
      { sub: true, cond: true, label: 'Reasons for marketing difficulty', req: true,
        choices: ['Lack of market access', 'Low customer demand', 'Competition from other entities', 'Low product quality', 'Poor packaging', 'Transportation issues', 'Lack of branding', 'Seasonal demand fluctuation', 'Others'] },
      { sub: true, cond: true, label: 'Specify if "Others" selected' },
      { id: 'B.2', label: 'Were products sold at a lower price than previous year? (Yes / No)', req: true },

      { id: 'C.1', label: 'Did you require additional working capital during FY 2025-26? (Yes / No)', req: true },
      { sub: true, cond: true, label: 'Did you receive adequate fund? (Yes / No)', req: true },
      { sub: true, cond: true, label: 'Sources of financial difficulty', req: true,
        choices: ['Bank loan not sanctioned', 'Insufficient loan amount', 'Delay in loan disbursement', 'High indebtedness', 'Others'] },
      { sub: true, cond: true, label: 'Specify if "Others" selected' },
      { sub: true, cond: true, label: 'Outstanding loan amount (₹)', req: true, note: 'C.3 — required when C.1 = Yes' },

      { id: 'D.1', label: 'Do you maintain business records?', req: true,
        choices: ['Regularly', 'Occasionally', 'Not at all'] },
      { id: 'D.2', label: 'Did lack of business skills affect income? (Yes / No)', req: true },
      { sub: true, cond: true, label: 'Skill areas requiring support', req: true,
        choices: ['Book keeping', 'Costing and pricing', 'Digital marketing', 'Business planning', 'Packaging', 'Quality control', 'Raw material sourcing', 'Others'] },
      { sub: true, cond: true, label: 'Specify if "Others" selected' },

      { id: 'E.1', label: 'Personal / family factors affecting income', req: true,
        choices: ['Illness of self/family member', 'Migration of family member', 'Childcare responsibilities', 'Family disputes', 'Death in family', 'Others'] },
      { sub: true, cond: true, label: 'Specify if "Others" selected' },

      { id: 'F.1', label: 'External factors affecting business', req: true,
        choices: ['Wrong Data Entry in DAR', 'Flood', 'Drought', 'Erosion', 'Market closure', 'Road / transport disruption', 'Policy change', 'Inflation', 'Diseases', 'Others'] },
      { sub: true, cond: true, label: 'Specify if "Others" selected' },
    ],
  },
  {
    num: '04', tag: 'Section 4', title: 'Support Received',
    desc: 'Types of support received during FY 2025-26',
    accent: { card: 'border-purple-200 bg-purple-50', num: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
    fields: [
      { id: '4.1', label: 'Support types received during FY 2025-26', req: true, note: 'select all that apply',
        choices: ['CIF', 'CEF', 'MMUA', 'Bank Credit', 'Training', 'Market Linkage', 'Packaging Support', 'Equipment Support', 'Digital Marketing Support', 'Others'] },
      { sub: true, cond: true, label: 'Specify other support received', req: true },
    ],
  },
  {
    num: '05', tag: 'Section 5', title: 'Support Required',
    desc: 'Rate every intervention High / Medium / Low',
    accent: { card: 'border-orange-200 bg-orange-50', num: 'bg-orange-100 text-orange-600', dot: 'bg-orange-400' },
    fields: [
      { id: '5.1', label: 'Rate every intervention — all rows must be filled', req: true, note: 'options: High / Medium / Low' },
      { sub: true, label: 'Additional Working Capital' },
      { sub: true, label: 'Bank Credit Linkage' },
      { sub: true, label: 'Market Linkages' },
      { sub: true, label: 'Product Diversification' },
      { sub: true, label: 'Packaging Support' },
      { sub: true, label: 'Branding Support' },
      { sub: true, label: 'Skill Training' },
      { sub: true, label: 'Equipment / Machinery' },
      { sub: true, label: 'Insurance Support' },
      { sub: true, label: 'Procurement Support' },
      { sub: true, label: 'E-commerce Access' },
    ],
  },
  {
    num: '06', tag: 'Section 6', title: 'Restoration Plan',
    desc: 'Feasibility of restoring income to Lakhpati level within 1 year',
    accent: { card: 'border-teal-200 bg-teal-50', num: 'bg-teal-100 text-teal-700', dot: 'bg-teal-400' },
    fields: [
      { id: '6.1', label: 'Can income be restored to ≥ ₹1,00,000/year within 1 year?', req: true,
        choices: ['Yes', 'No', 'Maybe'] },
      { label: 'Additional remarks', note: 'optional — any context about restoration potential' },
    ],
  },
  {
    num: '07', tag: 'Section 7', title: 'BMMU Assessment',
    desc: 'Risk categorisation, recommended intervention & consent',
    accent: { card: 'border-amber-200 bg-amber-50', num: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
    fields: [
      { id: '7.1', label: 'Primary reason for income decline', req: true,
        choices: ['Production Issues', 'Marketing Issues', 'Financial Issues', 'Enterprise Management', 'Personal / Family Factors', 'External Factors'] },
      { id: '7.2', label: 'Secondary reason for income decline', note: 'optional — must differ from primary' },
      { id: '7.3', label: 'Risk category', req: true, choices: ['Low', 'Medium', 'High'] },
      { id: '7.4', label: 'Recommended intervention(s)', req: true, note: 'from Section 5 support options — select all that apply' },
      { id: '7.5', label: 'Enumerator name', req: true, note: 'letters only' },
      { id: '7.6', label: 'Designation', req: true, choices: ['Block Project Manager (BPM)', 'Block Coordinator (BC)'] },
      { id: '7.7', label: 'Date of survey', req: true },
      { label: 'Consent of Lakhpati Didi surveyed', req: true, note: 'LD confirms information is accurate' },
      { label: 'Declaration by BMMU official', req: true, note: 'enumerator confirms assessment is verified' },
    ],
  },
]

const STATS = [
  { value: '3,494', label: 'Lakhpati Didis', sub: 'to be surveyed' },
  { value: '35',    label: 'Districts',      sub: 'across Assam' },
  { value: '7',     label: 'Sections',       sub: 'in this survey' },
  { value: '2',     label: 'Financial Years', sub: 'FY 24-25 & 25-26' },
]

/* ── Field row in guide panel ─────────────────────────────── */

function FieldRow({ f }) {
  return (
    <div className={`flex items-start gap-2.5 py-1.5 ${f.sub ? 'ml-5 pl-3 border-l border-gray-200' : ''}`}>
      {f.auto ? (
        <span className="mt-1 text-blue-400 text-[10px] font-bold shrink-0">AUTO</span>
      ) : f.sub ? (
        <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 shrink-0" />
      ) : (
        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-700">
          {f.id && <span className="text-gray-400 text-[11px] font-semibold mr-1.5">{f.id}</span>}
          {f.label}
          {f.req && <span className="text-red-400 ml-1 text-xs">*</span>}
          {f.auto && <span className="ml-1.5 text-[10px] font-semibold text-blue-500 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">auto-filled</span>}
          {f.cond && <span className="ml-1.5 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">if applicable</span>}
        </span>
        {f.note && <p className="text-[11px] text-gray-400 mt-0.5">{f.note}</p>}
        {f.choices && (
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
            {f.choices.map((c, i) => (
              <span key={c}>
                <span className="bg-white/80 border border-gray-200 rounded px-1 py-0.5 text-gray-600">{c}</span>
                {i < f.choices.length - 1 && <span className="text-gray-300 mx-0.5">·</span>}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────── */

export default function Home() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const guideRef = useRef(null)

  const activeSection = SECTIONS.find(s => s.num === selected)

  useEffect(() => {
    if (selected && guideRef.current) {
      guideRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selected])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F4F6F9' }}>

      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/asrlm_logo.png" alt="ASRLM" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-[10px] text-gray-400 leading-none uppercase tracking-widest font-semibold">
                Government of Assam
              </p>
              <p className="text-sm font-bold text-gray-900 leading-snug">
                Assam State Rural Livelihoods Mission
                <span className="ml-1.5 text-green-600 font-semibold text-xs">(ASRLM)</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-bold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            Admin Login
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-green-100"
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 55%, #ecfdf5 100%)' }}>
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #86efac, transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6ee7b7, transparent 70%)' }} />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #16a34a, transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* Left */}
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200 mb-6 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                FY 2025-26 · Income Decline Assessment
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5">
                Lakhpati Didi<br />
                <span className="text-green-600">Survey Portal</span>
              </h1>
              <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
                Field assessment of income decline among Lakhpati Didis across all 35 districts
                of Assam. Conducted by BMMU officials to identify and restore livelihoods.
              </p>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <button
                  onClick={() => navigate('/survey')}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-green-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Start New Survey →
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-white border border-gray-200 text-gray-700 font-semibold px-7 py-3.5 rounded-xl text-sm hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Admin Dashboard
                </button>
              </div>
            </div>

            {/* Right — Enhanced stats card */}
            <div className="w-full lg:w-[340px] shrink-0">
              <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">
                <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}>
                  <p className="text-green-100 text-[10px] font-bold uppercase tracking-widest">Survey Overview</p>
                  <p className="text-white font-extrabold text-lg mt-0.5">FY 2025-26 · ASRLM</p>
                  <p className="text-green-200 text-xs mt-1">Lakhpati Didi Income Decline Assessment</p>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3">
                  {[
                    { value: '3,494', label: 'Lakhpati Didis', sub: 'to be surveyed', color: 'text-green-700', bg: 'bg-green-50' },
                    { value: '35',    label: 'Districts',      sub: 'across Assam',   color: 'text-blue-700',  bg: 'bg-blue-50'  },
                    { value: '7',     label: 'Sections',       sub: 'in this survey', color: 'text-purple-700',bg: 'bg-purple-50'},
                    { value: '2',     label: 'Financial Years',sub: 'FY 24-25 & 25-26',color:'text-amber-700', bg: 'bg-amber-50' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                      <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-xs font-bold text-gray-700 mt-1">{s.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Survey Sections</h2>
            <p className="text-sm text-gray-500 mt-1">
              Complete all 7 sections — tap any section to see what to fill in.
            </p>
          </div>
        </div>

        {/* Section cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {SECTIONS.map(s => {
            const isActive = selected === s.num
            return (
              <button
                key={s.num}
                onClick={() => setSelected(isActive ? null : s.num)}
                className={`text-left rounded-2xl border p-4 sm:p-5 transition-all group ${
                  isActive
                    ? `${s.accent.card} shadow-md`
                    : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.tag}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center transition-colors ${
                      isActive ? s.accent.num : 'bg-gray-100 text-gray-500'
                    }`}>
                      {s.num}
                    </span>
                    <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-900 leading-snug mb-1.5">{s.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </button>
            )
          })}

          {/* CTA card */}
          <div className="bg-gray-900 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl">📋</div>
            <div>
              <p className="font-bold text-white text-sm">Ready to begin?</p>
              <p className="text-xs text-gray-400 mt-0.5">Open the survey form below</p>
            </div>
            <button
              onClick={() => navigate('/survey')}
              className="bg-white text-gray-900 font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors w-full"
            >
              Start Survey
            </button>
          </div>
        </div>

        {/* Field guide panel */}
        {activeSection && (
          <div ref={guideRef} className={`mt-4 rounded-2xl border p-5 sm:p-6 ${activeSection.accent.card}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{activeSection.tag}</p>
                <h3 className="text-base font-extrabold text-gray-900">{activeSection.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{activeSection.desc}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-3 text-[10px] text-gray-500 hidden sm:flex">
                  <span className="flex items-center gap-1">
                    <span className="text-red-400 font-bold">*</span> Required
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-blue-500 font-bold text-[9px] bg-blue-50 border border-blue-100 px-1 rounded">AUTO</span> Auto-filled
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-amber-600 font-bold text-[9px] bg-amber-50 border border-amber-100 px-1 rounded">if applicable</span> Conditional
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/10 text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="bg-white/70 rounded-xl px-4 py-3 divide-y divide-gray-100">
              {activeSection.fields.map((f, i) => (
                <FieldRow key={i} f={f} />
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/asrlm_logo.png" alt="ASRLM" className="h-6 w-6 object-contain" />
            <span className="text-xs text-gray-500 font-medium">
              Assam State Rural Livelihoods Mission (ASRLM) · Government of Assam
            </span>
          </div>
          <p className="text-xs text-gray-400">Lakhpati Didi Income Decline Assessment · FY 2025-26 · <span className="font-semibold">v1.0</span></p>
        </div>
      </footer>
    </div>
  )
}
