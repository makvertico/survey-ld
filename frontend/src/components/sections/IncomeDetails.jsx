import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { INCOME_SOURCES } from '../../config/districts'

function fmt(n) {
  return Number(n || 0).toLocaleString('en-IN')
}

function Num({ n }) {
  return <span className="text-gray-400 text-[11px] font-semibold mr-1.5">{n}</span>
}

export default function IncomeDetails() {
  const { register, control, setValue, formState: { errors } } = useFormContext()

  const income2425 = useWatch({ control, name: 'income_2425' })
  const income2526 = useWatch({ control, name: 'income_2526' })
  const selectedSources = useWatch({ control, name: 'income_sources' }) || []
  const highestDecline = useWatch({ control, name: 'highest_decline_source' })

  const decline = (parseFloat(income2425) || 0) - (parseFloat(income2526) || 0)
  const pct = income2425 > 0 ? ((decline / parseFloat(income2425)) * 100).toFixed(1) : '—'

  const hasIncome = income2425 && income2526
  const othersChecked = Array.isArray(selectedSources) && selectedSources.includes('Others')

  // Reset highest_decline_source if its value is no longer among selected sources
  useEffect(() => {
    if (highestDecline && !selectedSources.includes(highestDecline)) {
      setValue('highest_decline_source', '')
    }
  }, [selectedSources, highestDecline, setValue])

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-green-800 border-b border-green-200 pb-2">
        Section 2 — Income Details
      </h2>

      {!hasIncome ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          Please select a Lakhpati Didi in Section 1 — income data will auto-fill from the master data.
        </div>
      ) : (
        <>
          {/* Pre-filled income display */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
              Income Data — Pre-filled from ASRLM Records
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-blue-100 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1"><Num n="2.1" />Annual Income FY 2024-25</p>
                <p className="text-2xl font-bold text-gray-800">₹ {fmt(income2425)}</p>
              </div>
              <div className="bg-white rounded-lg border border-blue-100 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1"><Num n="2.2" />Annual Income FY 2025-26</p>
                <p className="text-2xl font-bold text-gray-800">₹ {fmt(income2526)}</p>
              </div>
              <div className="bg-red-50 rounded-lg border border-red-200 p-3 text-center">
                <p className="text-xs text-red-600 mb-1"><Num n="2.3" />Income Decline Amount / <Num n="2.4" />Decline %</p>
                <p className="text-2xl font-bold text-red-700">₹ {fmt(decline)}</p>
                <p className="text-sm font-semibold text-red-500 mt-0.5">↓ {pct}%</p>
              </div>
            </div>
            {/* Hidden registered fields — values set by LD selection in BasicInfo */}
            <input type="hidden" {...register('income_2425')} />
            <input type="hidden" {...register('income_2526')} />
          </div>

          {/* Income sources — enumerator fills */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Num n="2.5" />Main Source(s) of Income{' '}
              <span className="text-red-500">*</span>
              <span className="font-normal text-gray-400 text-xs ml-1">(select all that apply)</span>
            </label>
            {/* Hidden sentinel for group validation */}
            <input
              type="hidden"
              {...register('income_sources__v', {
                validate: (_, fv) => {
                  const v = fv.income_sources
                  return (Array.isArray(v) && v.length > 0) || 'Please select at least one income source'
                },
              })}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {INCOME_SOURCES.map(source => (
                <label key={source} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={source}
                    {...register('income_sources')}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{source}</span>
                </label>
              ))}
            </div>
            {errors.income_sources__v && (
              <p className="text-red-500 text-xs mt-1">{errors.income_sources__v.message}</p>
            )}

            {othersChecked && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specify other income source <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('income_sources_other', { required: 'Please specify "Others"' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder='Please specify "Others"…'
                />
                {errors.income_sources_other && (
                  <p className="text-red-500 text-xs mt-1">{errors.income_sources_other.message}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              <Num n="2.6" />Which income source experienced the highest decline?{' '}
              <span className="text-red-500">*</span>
            </label>
            {selectedSources.length === 0 ? (
              <p className="text-xs text-amber-600 mt-1">Select income sources above to enable this field.</p>
            ) : (
              <>
                <select
                  {...register('highest_decline_source', {
                    required: 'Please select the source with highest decline',
                    validate: (val) =>
                      !val || selectedSources.includes(val) || 'Selected source must be from your chosen income sources',
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Select source --</option>
                  {selectedSources.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.highest_decline_source && (
                  <p className="text-red-500 text-xs mt-1">{errors.highest_decline_source.message}</p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
