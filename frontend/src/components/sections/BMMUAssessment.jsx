import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { RISK_CATEGORIES, SUPPORT_REQUIRED_OPTIONS } from '../../config/districts'

const PRIMARY_REASONS = [
  'Production Issues',
  'Marketing Issues',
  'Financial Issues',
  'Enterprise Management',
  'Personal / Family Factors',
  'External Factors',
]

const blockDigits = (e) => {
  const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'Home', 'End', ' ']
  if (!allowed.includes(e.key) && /\d/.test(e.key)) {
    e.preventDefault()
  }
}

function Num({ n }) {
  return <span className="text-gray-400 text-[11px] font-semibold mr-1.5">{n}</span>
}

export default function BMMUAssessment() {
  const { register, control, setValue, formState: { errors } } = useFormContext()

  const ldName        = useWatch({ control, name: 'ld_name' })
  const primaryReason = useWatch({ control, name: 'primary_reason' })
  const secondaryReason = useWatch({ control, name: 'secondary_reason' })
  const enumeratorName = useWatch({ control, name: 'enumerator_name' })

  // Reset secondary if it matches primary
  useEffect(() => {
    if (primaryReason && secondaryReason === primaryReason) {
      setValue('secondary_reason', '')
    }
  }, [primaryReason, secondaryReason, setValue])

  const secondaryOptions = PRIMARY_REASONS.filter(r => r !== primaryReason)

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-green-800 border-b border-green-200 pb-2">
        Section 7 — BMMU Assessment
      </h2>

      <p className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        For BMMU Officials.
      </p>

      {/* LD Surveyed */}
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-sm font-medium text-green-700">LD Surveyed:</span>
        <span className="text-base font-bold text-green-900">{ldName || '—'}</span>
      </div>

      {/* A & B — Reasons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Num n="7.1" />Primary Reason for Income Decline <span className="text-red-500">*</span>
          </label>
          <select
            {...register('primary_reason', { required: 'Primary reason is required' })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Select --</option>
            {PRIMARY_REASONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {errors.primary_reason && <p className="text-red-500 text-xs mt-1">{errors.primary_reason.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Num n="7.2" />Secondary Reason
            {primaryReason && (
              <span className="ml-1 text-xs text-gray-400 font-normal">(different from primary)</span>
            )}
          </label>
          <select
            {...register('secondary_reason')}
            disabled={!primaryReason}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:bg-gray-50"
          >
            <option value="">{primaryReason ? '-- Select (optional) --' : '-- Select primary first --'}</option>
            {secondaryOptions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* C — Risk Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Num n="7.3" />Risk Category <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          {RISK_CATEGORIES.map(cat => {
            const colors = {
              Low:    'border-green-300 bg-green-50 text-green-800',
              Medium: 'border-amber-300 bg-amber-50 text-amber-800',
              High:   'border-red-300 bg-red-50 text-red-800',
            }
            return (
              <label
                key={cat}
                className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2 flex-1 justify-center font-medium text-sm ${colors[cat]}`}
              >
                <input
                  type="radio"
                  value={cat}
                  {...register('risk_category', { required: 'Risk category is required' })}
                  className="focus:ring-green-500"
                />
                {cat}
              </label>
            )
          })}
        </div>
        {errors.risk_category && <p className="text-red-500 text-xs mt-1">{errors.risk_category.message}</p>}
      </div>

      {/* D — Recommended Intervention */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-green-50 px-4 py-2.5 border-b border-gray-200">
          <h3 className="font-semibold text-green-800 text-sm">
            <Num n="7.4" />Recommended Intervention <span className="text-red-500">*</span>
            <span className="font-normal text-green-600 text-xs ml-1">
              (select from Section 5 — Support Required)
            </span>
          </h3>
        </div>
        <div className="p-4">
          <input
            type="hidden"
            {...register('recommended_interventions__v', {
              validate: (_, fv) => {
                const v = fv.recommended_interventions
                return (Array.isArray(v) && v.length > 0) || 'Please select at least one recommended intervention'
              },
            })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUPPORT_REQUIRED_OPTIONS.map(opt => (
              <label key={opt} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={opt}
                  {...register('recommended_interventions')}
                  className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
          {errors.recommended_interventions__v && (
            <p className="text-red-500 text-xs mt-2">{errors.recommended_interventions__v.message}</p>
          )}
        </div>
      </div>

      {/* Enumerator Details */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Enumerator Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Num n="7.5" />Enumerator Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('enumerator_name', {
                required: 'Enumerator name is required',
                pattern: {
                  value: /^[A-Za-z\s.'-]+$/,
                  message: 'Name must contain letters only',
                },
              })}
              onKeyDown={blockDigits}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Full name"
            />
            {errors.enumerator_name && <p className="text-red-500 text-xs mt-1">{errors.enumerator_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Num n="7.6" />Designation <span className="text-red-500">*</span>
            </label>
            <select
              {...register('designation', { required: 'Designation is required' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Select --</option>
              <option value="Block Project Manager (BPM)">Block Project Manager (BPM)</option>
              <option value="Block Coordinator (BC)">Block Coordinator (BC)</option>
            </select>
            {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Num n="7.7" />Date of Survey <span className="text-red-500">*</span>
            </label>
            <input
              {...register('survey_date', { required: 'Survey date is required' })}
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.survey_date && <p className="text-red-500 text-xs mt-1">{errors.survey_date.message}</p>}
          </div>
        </div>
      </div>

      {/* Consent declarations */}
      <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
        {/* LD Consent */}
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Consent of Lakhpati Didi Surveyed
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('ld_consent', {
                validate: v => v === true || 'LD consent is required to submit',
              })}
              className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
            />
            <span className="text-sm text-gray-700">
              I, <span className="font-semibold">{ldName || '___________'}</span>, confirm that the
              information recorded in this survey is accurate.
            </span>
          </label>
          {errors.ld_consent && (
            <p className="text-red-500 text-xs mt-1 ml-7">{errors.ld_consent.message}</p>
          )}
        </div>

        {/* BMMU Official Declaration */}
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Declaration by BMMU Official
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('bmmu_consent', {
                validate: v => v === true || 'Declaration is required to submit',
              })}
              className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
            />
            <span className="text-sm text-gray-700">
              I, <span className="font-semibold">{enumeratorName || '___________'}</span>, hereby declare that the above
              assessment has been conducted and verified by me, and the information recorded
              is true to the best of my knowledge.
            </span>
          </label>
          {errors.bmmu_consent && (
            <p className="text-red-500 text-xs mt-1 ml-7">{errors.bmmu_consent.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
