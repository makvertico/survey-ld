import { useFormContext } from 'react-hook-form'
import { SUPPORT_RECEIVED_OPTIONS } from '../../config/districts'

function Num({ n }) {
  return <span className="text-gray-400 text-[11px] font-semibold mr-1.5">{n}</span>
}

export default function SupportReceived() {
  const { register, watch, formState: { errors } } = useFormContext()
  const received = watch('support_received') || []
  const othersChecked = received.includes('Others')

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-green-800 border-b border-green-200 pb-2">
        Section 4 — Support Received (FY 2025-26)
      </h2>
      <p className="text-sm text-gray-500">
        <Num n="4.1" />Select all types of support received during FY 2025-26.{' '}
        <span className="text-gray-400">(Select "Others" to specify additional support)</span>
      </p>

      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        {/* Hidden sentinel for group validation */}
        <input
          type="hidden"
          {...register('support_received__v', {
            validate: (_, fv) => {
              const v = fv.support_received
              return (Array.isArray(v) && v.length > 0) || 'Please select at least one type of support received'
            },
          })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {SUPPORT_RECEIVED_OPTIONS.map(option => (
            <label key={option} className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                value={option}
                {...register('support_received')}
                className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>

        {errors.support_received__v && (
          <p className="text-red-500 text-xs">{errors.support_received__v.message}</p>
        )}

        {othersChecked && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specify other support received <span className="text-red-500">*</span>
            </label>
            <input
              {...register('support_received_other', { required: 'Please specify "Others"' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder='Please specify "Others"…'
            />
            {errors.support_received_other && (
              <p className="text-red-500 text-xs mt-1">{errors.support_received_other.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
