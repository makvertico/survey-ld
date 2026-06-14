import { useFormContext, useWatch } from 'react-hook-form'

const ALLOWED_KEYS = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']

const blockNonNumeric = (e) => {
  if (!ALLOWED_KEYS.includes(e.key) && !/^\d$/.test(e.key) && !(e.ctrlKey || e.metaKey)) {
    e.preventDefault()
  }
}

/* ─── number badge ────────────────────────────────────────── */

function Num({ n }) {
  return <span className="text-gray-400 text-[11px] font-semibold mr-1.5">{n}</span>
}

/* ─── primitives ──────────────────────────────────────────── */

function YesNo({ name, label, num, requiredWhen }) {
  const { register, getValues, formState: { errors } } = useFormContext()

  const validationRule = {
    validate: (val) => {
      const needed = requiredWhen ? requiredWhen(getValues) : true
      if (!needed) return true
      return !!val || 'Please select Yes or No'
    },
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-800 mb-2">
        {num && <Num n={num} />}{label}
      </p>
      <div className="flex gap-5">
        {['Yes', 'No'].map(v => (
          <label key={v} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value={v}
              {...register(name, validationRule)}
              className="text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">{v}</span>
          </label>
        ))}
      </div>
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>
      )}
    </div>
  )
}

function CheckList({ name, options, label, num, validateFn }) {
  const { register, getValues, formState: { errors } } = useFormContext()
  const validatorKey = `${name}__v`

  return (
    <div>
      <input
        type="hidden"
        {...register(validatorKey, {
          validate: validateFn ? () => validateFn(getValues) : undefined,
        })}
      />
      {label && (
        <p className="text-sm font-medium text-gray-700 mb-2">
          {num && <Num n={num} />}{label}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {options.map(opt => (
          <label key={opt} className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              value={opt}
              {...register(name)}
              className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">{opt}</span>
          </label>
        ))}
      </div>
      {errors[validatorKey] && (
        <p className="text-red-500 text-xs mt-2">{errors[validatorKey].message}</p>
      )}
    </div>
  )
}

function OtherText({ name, watchField }) {
  const { register, watch, formState: { errors } } = useFormContext()
  const values = watch(watchField) || []
  const othersChecked = Array.isArray(values) && values.includes('Others')

  if (!othersChecked) return null

  return (
    <div>
      <input
        {...register(name, { required: 'Please specify "Others"' })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder='Please specify "Others"…'
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>
      )}
    </div>
  )
}

function SectionBox({ letter, title, children }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-green-50 px-4 py-2.5 border-b border-gray-200">
        <h3 className="font-semibold text-green-800 text-sm">{letter}. {title}</h3>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
}

function Indent({ show, children }) {
  if (!show) return null
  return (
    <div className="ml-4 pl-4 border-l-2 border-green-200 space-y-3">
      {children}
    </div>
  )
}

/* ─── main component ──────────────────────────────────────── */

export default function DeclineReasons() {
  const { register, formState: { errors } } = useFormContext()

  const prodReduced    = useWatch({ name: 'dr_a_produced_reduced' })
  const mktDifficulty  = useWatch({ name: 'dr_b_mkt_difficulty' })
  const needWorkCap    = useWatch({ name: 'dr_c_need_working_cap' })
  const adequateFund   = useWatch({ name: 'dr_c_adequate_fund' })
  const skillsAffected = useWatch({ name: 'dr_d_skills_affected' })

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-green-800 border-b border-green-200 pb-2">
        Section 3 — Reason for Income Decline
      </h2>
      <p className="text-xs text-gray-500">
        Answer all gate questions. Sub-items appear only when relevant.
      </p>

      {/* ── A. Production ── */}
      <SectionBox letter="A" title="Production Related Issues">
        <YesNo
          num="A.1"
          name="dr_a_produced_reduced"
          label="Did production reduce during FY 2025-26? *"
          requiredWhen={() => true}
        />
        <Indent show={prodReduced === 'Yes'}>
          <CheckList
            name="dr_a_reasons"
            label="Reason for decline: *"
            options={[
              'Lack of raw materials', 'High input cost', 'Labour shortage',
              'Climate / Natural disaster', 'Disease / Pest attack',
              'Lack of equipment', 'Lack of Finance', 'Others',
            ]}
            validateFn={(gv) => {
              if (gv('dr_a_produced_reduced') !== 'Yes') return true
              const v = gv('dr_a_reasons')
              return (Array.isArray(v) && v.length > 0) || 'Please select at least one reason'
            }}
          />
          <OtherText name="dr_a_others" watchField="dr_a_reasons" />
        </Indent>
      </SectionBox>

      {/* ── B. Marketing ── */}
      <SectionBox letter="B" title="Marketing Related Issues">
        <YesNo
          num="B.1"
          name="dr_b_mkt_difficulty"
          label="Did you face difficulty selling products/services? *"
          requiredWhen={() => true}
        />
        <Indent show={mktDifficulty === 'Yes'}>
          <CheckList
            name="dr_b_reasons"
            label="Reason for difficulty: *"
            options={[
              'Lack of market access', 'Low customer demand',
              'Competition from other entities', 'Low product quality',
              'Poor packaging', 'Transportation issues',
              'Lack of branding', 'Seasonal demand fluctuation', 'Others',
            ]}
            validateFn={(gv) => {
              if (gv('dr_b_mkt_difficulty') !== 'Yes') return true
              const v = gv('dr_b_reasons')
              return (Array.isArray(v) && v.length > 0) || 'Please select at least one reason'
            }}
          />
          <OtherText name="dr_b_others" watchField="dr_b_reasons" />
        </Indent>
        <YesNo
          num="B.2"
          name="dr_b_lower_price"
          label="Were products sold at a lower price than the previous year? *"
          requiredWhen={() => true}
        />
      </SectionBox>

      {/* ── C. Financial ── */}
      <SectionBox letter="C" title="Financial Issues">
        <YesNo
          num="C.1"
          name="dr_c_need_working_cap"
          label="Did you require additional working capital during FY 2025-26? *"
          requiredWhen={() => true}
        />

        <Indent show={needWorkCap === 'Yes'}>
          <YesNo
            num="C.2"
            name="dr_c_adequate_fund"
            label="Did you receive adequate fund? *"
            requiredWhen={(gv) => gv('dr_c_need_working_cap') === 'Yes'}
          />

          <Indent show={adequateFund === 'No'}>
            <CheckList
              name="dr_c_reasons"
              label="Source of difficulty: *"
              options={[
                'Bank loan not sanctioned', 'Insufficient loan amount',
                'Delay in loan disbursement', 'High indebtedness', 'Others',
              ]}
              validateFn={(gv) => {
                if (gv('dr_c_need_working_cap') !== 'Yes') return true
                if (gv('dr_c_adequate_fund') !== 'No') return true
                const v = gv('dr_c_reasons')
                return (Array.isArray(v) && v.length > 0) || 'Please select at least one reason'
              }}
            />
            <OtherText name="dr_c_others" watchField="dr_c_reasons" />
          </Indent>

          {/* C.3 — Separate standalone question, not tied to adequate fund answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Num n="C.3" />Outstanding loan amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              {...register('dr_c_outstanding_loan', {
                setValueAs: v => (v === '' || v === null || v === undefined) ? null : Number(v),
                validate: (v, fv) => {
                  if (fv.dr_c_need_working_cap === 'Yes' && (v === null || v === undefined))
                    return 'Outstanding loan amount is required'
                  if (v !== null && v !== undefined && v < 0)
                    return 'Amount cannot be negative'
                  return true
                },
              })}
              onKeyDown={blockNonNumeric}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. 50000"
            />
            {errors.dr_c_outstanding_loan && (
              <p className="text-red-500 text-xs mt-1">{errors.dr_c_outstanding_loan.message}</p>
            )}
          </div>
        </Indent>
      </SectionBox>

      {/* ── D. Enterprise Management ── */}
      <SectionBox letter="D" title="Enterprise Management Issues">
        <div>
          <p className="text-sm font-medium text-gray-800 mb-2">
            <Num n="D.1" />Do you maintain business records? *
          </p>
          <div className="flex flex-wrap gap-4">
            {['Regularly', 'Occasionally', 'Not at all'].map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={v}
                  {...register('dr_d_records', { required: 'Please select an option' })}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{v}</span>
              </label>
            ))}
          </div>
          {errors.dr_d_records && (
            <p className="text-red-500 text-xs mt-1">{errors.dr_d_records.message}</p>
          )}
        </div>

        <YesNo
          num="D.2"
          name="dr_d_skills_affected"
          label="Did lack of business skills affect income? *"
          requiredWhen={() => true}
        />

        <Indent show={skillsAffected === 'Yes'}>
          <CheckList
            name="dr_d_skill_areas"
            label="Areas requiring support: *"
            options={[
              'Book keeping', 'Costing and pricing', 'Digital marketing',
              'Business planning', 'Packaging', 'Quality control',
              'Raw material sourcing', 'Others',
            ]}
            validateFn={(gv) => {
              if (gv('dr_d_skills_affected') !== 'Yes') return true
              const v = gv('dr_d_skill_areas')
              return (Array.isArray(v) && v.length > 0) || 'Please select at least one area'
            }}
          />
          <OtherText name="dr_d_others" watchField="dr_d_skill_areas" />
        </Indent>
      </SectionBox>

      {/* ── E. Personal / Family ── */}
      <SectionBox letter="E" title="Personal / Family Factors">
        <CheckList
          num="E.1"
          name="dr_e_factors"
          label="Did any of the following affect your income? *"
          options={[
            'Illness of self/family member', 'Migration of family member',
            'Childcare responsibilities', 'Family disputes',
            'Death in family', 'Others',
          ]}
          validateFn={(gv) => {
            const v = gv('dr_e_factors')
            return (Array.isArray(v) && v.length > 0) || 'Please select at least one factor'
          }}
        />
        <OtherText name="dr_e_others" watchField="dr_e_factors" />
      </SectionBox>

      {/* ── F. External ── */}
      <SectionBox letter="F" title="External Factors">
        <CheckList
          num="F.1"
          name="dr_f_factors"
          label="Did any external event affect your business? *"
          options={[
            'Wrong Data Entry in DAR', 'Flood', 'Drought', 'Erosion',
            'Market closure', 'Road / transport disruption',
            'Policy change', 'Inflation', 'Diseases', 'Others',
          ]}
          validateFn={(gv) => {
            const v = gv('dr_f_factors')
            return (Array.isArray(v) && v.length > 0) || 'Please select at least one factor'
          }}
        />
        <OtherText name="dr_f_others" watchField="dr_f_factors" />
      </SectionBox>
    </div>
  )
}
