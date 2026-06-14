import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import BasicInfo from './sections/BasicInfo'
import IncomeDetails from './sections/IncomeDetails'
import DeclineReasons from './sections/DeclineReasons'
import SupportReceived from './sections/SupportReceived'
import SupportRequired from './sections/SupportRequired'
import Restoration from './sections/Restoration'
import BMMUAssessment from './sections/BMMUAssessment'
import { useSurvey } from '../hooks/useSurvey'

const SECTIONS = [
  { label: 'Basic Info', short: 'Basic',   component: BasicInfo },
  { label: 'Income',     short: 'Income',  component: IncomeDetails },
  { label: 'Reasons',    short: 'Reasons', component: DeclineReasons },
  { label: 'Received',   short: 'Recv.',   component: SupportReceived },
  { label: 'Required',   short: 'Req.',    component: SupportRequired },
  { label: 'Restore',    short: 'Restore', component: Restoration },
  { label: 'BMMU',       short: 'BMMU',    component: BMMUAssessment },
]

/* ── Loading overlay ── */
function LoadingOverlay() {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm anim-fade-in">
      <div className="relative w-20 h-20 mb-6">
        <div className="anim-ripple absolute inset-0 rounded-full bg-green-100" />
        <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
        <svg className="absolute inset-0 w-20 h-20 anim-spin" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" strokeDasharray="60 165" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/asrlm_logo.png" alt="" className="w-9 h-9 object-contain" />
        </div>
      </div>
      <p className="text-gray-900 font-bold text-base">Submitting Survey…</p>
      <p className="text-gray-400 text-sm mt-1">Please wait, do not close this page</p>
    </div>
  )
}

/* ── Success screen ── */
function SuccessScreen({ onAnother }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F4F6F9' }}>
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 text-center max-w-md w-full anim-fade-in-up">

        <div className="flex justify-center mb-7">
          <div className="relative anim-scale-in">
            <div className="anim-ripple absolute inset-0 rounded-full bg-green-100" />
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
              <svg viewBox="0 0 52 52" className="w-12 h-12" fill="none">
                <polyline
                  points="14,27 22,35 38,17"
                  stroke="white"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="anim-draw-check"
                />
              </svg>
            </div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Survey Submitted!</h2>
        <p className="text-gray-500 text-sm sm:text-base mb-8 leading-relaxed">
          The Lakhpati Didi assessment has been recorded successfully in the ASRLM system.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onAnother}
            className="bg-gray-900 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md"
          >
            Submit Another Survey
          </button>
          <a
            href="/"
            className="border border-gray-200 text-gray-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-center"
          >
            Back to Home
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2">
          <img src="/asrlm_logo.png" alt="" className="h-5 w-5 object-contain opacity-50" />
          <p className="text-xs text-gray-400">Assam State Rural Livelihoods Mission (ASRLM)</p>
        </div>
      </div>
    </div>
  )
}

/* ── Main form ── */
export default function SurveyForm() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const { submitSurvey, loading, error } = useSurvey()
  const navigate = useNavigate()

  const methods = useForm({
    mode: 'onTouched',
    defaultValues: {
      district: '',
      block: '',
      gram_panchayat: '',
      ld_name: '',
      ld_code: '',
      shg_name: '',
      shg_code: '',
      village: '',
      mobile: '',
      social_category: '',
      household_size: '',
      earning_members: '',
      income_2425: '',
      income_2526: '',
      income_sources: [],
      income_sources_other: '',
      highest_decline_source: '',
      dr_a_produced_reduced: '',
      dr_a_reasons: [],
      dr_a_others: '',
      dr_b_mkt_difficulty: '',
      dr_b_reasons: [],
      dr_b_others: '',
      dr_b_lower_price: '',
      dr_c_need_working_cap: '',
      dr_c_adequate_fund: '',
      dr_c_reasons: [],
      dr_c_others: '',
      dr_c_outstanding_loan: '',
      dr_d_records: '',
      dr_d_skills_affected: '',
      dr_d_skill_areas: [],
      dr_d_others: '',
      dr_e_factors: [],
      dr_e_others: '',
      dr_f_factors: [],
      dr_f_others: '',
      support_received: [],
      support_received_other: '',
      support_required: {},
      restoration_possible: '',
      restoration_remarks: '',
      primary_reason: '',
      secondary_reason: '',
      risk_category: '',
      recommended_interventions: [],
      enumerator_name: '',
      designation: '',
      survey_date: new Date().toISOString().split('T')[0],
      ld_consent: false,
      bmmu_consent: false,
    },
  })

  const CurrentSection = SECTIONS[step - 1].component
  const pct = Math.round(((step - 1) / SECTIONS.length) * 100)

  const handleNext = async () => {
    const valid = await methods.trigger()
    if (valid) {
      setStep(s => Math.min(s + 1, SECTIONS.length))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setTimeout(() => {
        const el = document.querySelector('[aria-invalid="true"]')
                || document.querySelector('.text-red-500')
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
  }

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit = async (data) => {
    const ok = await submitSurvey(data)
    if (ok) setSubmitted(true)
  }

  const handleAnother = () => {
    setSubmitted(false)
    setStep(1)
    methods.reset()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (submitted) return <SuccessScreen onAnother={handleAnother} />

  return (
    <div className="min-h-screen" style={{ background: '#F4F6F9' }}>
      {loading && <LoadingOverlay />}

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="shrink-0 hover:opacity-75 transition-opacity"
            aria-label="Home"
          >
            <img src="/asrlm_logo.png" alt="ASRLM" className="h-9 w-9 object-contain" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight truncate">
              Lakhpati Didi Income Decline Assessment
            </h1>
            <p className="text-green-600 text-xs mt-0.5 font-semibold">ASRLM · FY 2024-25 & 2025-26</p>
          </div>
          <div className="shrink-0 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 text-center">
            <p className="text-[10px] text-green-500 uppercase tracking-wider font-bold leading-none">Step</p>
            <p className="text-sm font-extrabold text-green-700 leading-tight">{step}/{SECTIONS.length}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-5 pb-10">

        {/* Step indicators — flex-1 lines fill the space so all 7 always fit */}
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3.5 mb-4 shadow-sm">
          <div className="flex items-start w-full">
            {SECTIONS.map((s, i) => {
              const idx = i + 1
              const done = idx < step
              const active = idx === step
              const isLast = i === SECTIONS.length - 1
              return (
                <div key={s.label} className="flex items-start flex-1 min-w-0">
                  {/* Circle + label */}
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shrink-0 ${
                      done   ? 'bg-green-500 text-white shadow-sm' :
                      active ? 'bg-green-700 text-white scale-110 shadow-md shadow-green-200' :
                               'bg-gray-100 text-gray-400'
                    }`}>
                      {done ? (
                        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
                          <polyline points="3,8 6.5,11.5 13,4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : idx}
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-semibold leading-none text-center truncate w-full px-0.5 ${
                      active ? 'text-green-700' : done ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {s.short}
                    </span>
                  </div>
                  {/* Connector line — flex-1 stretches between circles */}
                  {!isLast && (
                    <div className={`h-px flex-1 mx-1 mt-4 shrink-0 min-w-[4px] transition-colors duration-500 ${
                      done ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form section */}
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-4 shadow-sm anim-fade-in">
              <CurrentSection />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 sm:flex-none sm:w-32 border border-gray-200 bg-white text-gray-700 py-3.5 rounded-xl font-semibold text-sm shadow-sm
                    hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-md
                    active:translate-y-0 active:shadow-sm
                    transition-all duration-150"
                >
                  ← Back
                </button>
              )}

              {step < SECTIONS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-green-600 text-white py-3.5 rounded-xl font-bold text-sm
                    shadow-md shadow-green-200
                    hover:bg-green-500 hover:shadow-lg hover:shadow-green-200 hover:-translate-y-0.5
                    active:bg-green-700 active:translate-y-0 active:shadow-sm
                    transition-all duration-150"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3.5 rounded-xl font-bold text-sm
                    shadow-md shadow-green-200
                    hover:bg-green-500 hover:shadow-lg hover:shadow-green-200 hover:-translate-y-0.5
                    active:bg-green-700 active:translate-y-0 active:shadow-sm
                    transition-all duration-150
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
                >
                  {loading ? 'Submitting…' : 'Submit Survey ✓'}
                </button>
              )}
            </div>

            <p className="text-center text-xs text-gray-400 mt-4 font-medium">
              {pct}% complete · Step {step} of {SECTIONS.length}
            </p>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}
