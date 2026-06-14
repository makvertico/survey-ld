import { useFormContext } from 'react-hook-form'

function Num({ n }) {
  return <span className="text-gray-400 text-[11px] font-semibold mr-1.5">{n}</span>
}

export default function Restoration() {
  const { register, formState: { errors } } = useFormContext()

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-green-800 border-b border-green-200 pb-2">
        Section 6 — Restoration Outlook
      </h2>

      <div className="border border-gray-200 rounded-lg p-5">
        <p className="text-sm font-medium text-gray-800 mb-4">
          <Num n="6.1" />Can the Lakhpati Didi's income be restored to Lakhpati level (≥ ₹1,00,000 per year) within one year?{' '}
          <span className="text-red-500">*</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          {['Yes', 'No', 'Maybe'].map(option => (
            <label
              key={option}
              className="flex items-center gap-3 cursor-pointer border border-gray-200 rounded-lg px-4 py-3 hover:border-green-400 hover:bg-green-50 transition-colors flex-1"
            >
              <input
                type="radio"
                value={option}
                {...register('restoration_possible', { required: 'Please select an option' })}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-gray-800 font-medium">{option}</span>
            </label>
          ))}
        </div>

        {errors.restoration_possible && (
          <p className="text-red-500 text-xs mt-2">{errors.restoration_possible.message}</p>
        )}

        <div className="mt-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Num n="6.2" />Additional remarks (optional)
          </label>
          <textarea
            {...register('restoration_remarks')}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Any remarks about restoration potential..."
          />
        </div>
      </div>
    </div>
  )
}
