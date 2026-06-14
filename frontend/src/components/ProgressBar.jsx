export default function ProgressBar({ currentStep, totalSteps, labels }) {
  return (
    <div className="w-full">
      {/* Step dots */}
      <div className="flex items-center justify-between relative">
        {/* Connector line behind dots */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-green-500 z-0 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />

        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1
          const done = step < currentStep
          const active = step === currentStep
          return (
            <div key={step} className="flex flex-col items-center z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                  ${done ? 'bg-green-600 text-white' : active ? 'bg-green-500 text-white ring-4 ring-green-100' : 'bg-white border-2 border-gray-300 text-gray-400'}`}
              >
                {done ? '✓' : step}
              </div>
              {labels && (
                <span className={`mt-1.5 text-[10px] font-medium text-center max-w-[60px] leading-tight
                  ${active ? 'text-green-700' : done ? 'text-green-500' : 'text-gray-400'}`}>
                  {labels[i]}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
