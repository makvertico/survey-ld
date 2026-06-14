import { useFormContext } from 'react-hook-form'
import { SUPPORT_REQUIRED_OPTIONS, PRIORITY_LEVELS } from '../../config/districts'

function Num({ n }) {
  return <span className="text-gray-400 text-[11px] font-semibold mr-1.5">{n}</span>
}

export default function SupportRequired() {
  const { register, formState: { errors } } = useFormContext()

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-green-800 border-b border-green-200 pb-2">
        Section 5 — Support Required
      </h2>
      <p className="text-sm text-gray-500">
        <Num n="5.1" />Rate every intervention — all rows must be ranked. <span className="text-red-500">*</span>
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-800">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Intervention</th>
              {PRIORITY_LEVELS.map(level => (
                <th key={level} className="text-center px-4 py-3 font-medium w-20">{level}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUPPORT_REQUIRED_OPTIONS.map((option, idx) => {
              const fieldName = `support_required.${option}`
              const error = errors.support_required?.[option]
              return (
                <tr key={option} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-700">
                    {option}
                    {error && (
                      <span className="block text-red-500 text-xs mt-0.5">{error.message}</span>
                    )}
                  </td>
                  {PRIORITY_LEVELS.map(level => (
                    <td key={level} className="text-center px-4 py-3">
                      <input
                        type="radio"
                        value={level}
                        {...register(fieldName, { required: 'Required' })}
                        className="text-green-600 focus:ring-green-500 w-4 h-4"
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
