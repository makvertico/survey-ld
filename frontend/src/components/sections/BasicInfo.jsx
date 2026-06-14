import { useEffect, useState, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { DISTRICTS, LD_HIERARCHY, SOCIAL_CATEGORIES } from '../../config/districts'
import api from '../../lib/api'

const ALLOWED_KEYS = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']

const blockNonNumeric = (e) => {
  if (!ALLOWED_KEYS.includes(e.key) && !/^\d$/.test(e.key) && !(e.ctrlKey || e.metaKey)) {
    e.preventDefault()
  }
}

function Num({ n }) {
  return <span className="text-gray-400 text-[11px] font-semibold mr-1.5">{n}</span>
}

export default function BasicInfo() {
  const { register, watch, setValue, formState: { errors } } = useFormContext()

  const selectedDistrict = watch('district')
  const selectedBlock = watch('block')
  const selectedPanchayat = watch('gram_panchayat')

  const [ldList, setLdList] = useState([])
  const [ldSearch, setLdSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [ldMaster, setLdMaster] = useState([])
  const [surveyedCodes, setSurveyedCodes] = useState(new Set())
  const searchRef = useRef(null)

  // Load LD master data once
  useEffect(() => {
    fetch('/ld_master.json')
      .then(r => r.json())
      .then(data => setLdMaster(data))
  }, [])

  // When district/block/panchayat changes, filter LD list + fetch surveyed codes
  useEffect(() => {
    if (!selectedDistrict) { setLdList([]); setSurveyedCodes(new Set()); return }
    const filtered = ldMaster.filter(e =>
      e.district === selectedDistrict &&
      (!selectedBlock || e.block === selectedBlock) &&
      (!selectedPanchayat || e.panchayat === selectedPanchayat)
    )
    setLdList(filtered)
    setLdSearch('')
    // Clear LD fields when selection changes
    setValue('ld_name', '')
    setValue('ld_code', '')
    setValue('shg_name', '')
    setValue('shg_code', '')
    setValue('village', '')

    // Fetch already-surveyed LD codes — public endpoint, no auth required
    const params = new URLSearchParams({ district: selectedDistrict })
    if (selectedBlock) params.set('block', selectedBlock)
    api.get(`/surveys/surveyed-codes?${params}`)
      .then(({ data }) => {
        setSurveyedCodes(new Set(data?.codes || []))
      })
      .catch(() => setSurveyedCodes(new Set()))
  }, [selectedDistrict, selectedBlock, selectedPanchayat, ldMaster])

  const blocks = selectedDistrict ? Object.keys(LD_HIERARCHY[selectedDistrict] || {}).sort() : []
  const panchayats = (selectedDistrict && selectedBlock)
    ? (LD_HIERARCHY[selectedDistrict]?.[selectedBlock] || [])
    : []

  const filteredLds = ldSearch
    ? ldList.filter(e => e.ld_name.toLowerCase().includes(ldSearch.toLowerCase()))
    : ldList

  const selectLD = (entry) => {
    setValue('ld_name', entry.ld_name)
    setValue('ld_code', entry.ld_code)
    setValue('shg_name', entry.shg_name)
    setValue('shg_code', entry.shg_code)
    setValue('village', entry.village)
    setValue('income_2425', entry.income_2425)
    setValue('income_2526', entry.income_2526)
    setLdSearch(entry.ld_name)
    setShowDropdown(false)
  }

  const handleDistrictChange = (e) => {
    setValue('district', e.target.value)
    setValue('block', '')
    setValue('gram_panchayat', '')
    setValue('ld_name', '')
    setValue('ld_code', '')
    setValue('shg_name', '')
    setValue('shg_code', '')
    setValue('village', '')
    setValue('income_2425', '')
    setValue('income_2526', '')
    setLdSearch('')
  }

  const handleBlockChange = (e) => {
    setValue('block', e.target.value)
    setValue('gram_panchayat', '')
    setValue('ld_name', '')
    setValue('ld_code', '')
    setValue('shg_name', '')
    setValue('shg_code', '')
    setValue('village', '')
    setValue('income_2425', '')
    setValue('income_2526', '')
    setLdSearch('')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-green-800 border-b border-green-200 pb-2">
        Section 1 — Basic Information
      </h2>

      {/* Location cascade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* District */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Num n="1.1" />District <span className="text-red-500">*</span>
          </label>
          <select
            {...register('district', { required: 'District is required' })}
            onChange={handleDistrictChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Select District --</option>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>}
        </div>

        {/* Block */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Num n="1.2" />Block <span className="text-red-500">*</span>
          </label>
          <select
            {...register('block', { required: 'Block is required' })}
            onChange={handleBlockChange}
            disabled={!selectedDistrict}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            <option value="">-- Select Block --</option>
            {blocks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          {errors.block && <p className="text-red-500 text-xs mt-1">{errors.block.message}</p>}
        </div>

        {/* Gram Panchayat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1"><Num n="1.3" />Gram Panchayat</label>
          <select
            {...register('gram_panchayat')}
            disabled={!selectedBlock}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            <option value="">-- Select Panchayat --</option>
            {panchayats.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* LD Search & Auto-fill */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <label className="block text-sm font-semibold text-green-800 mb-2">
          <Num n="1.4" />Search Lakhpati Didi <span className="text-red-500">*</span>
          {ldList.length > 0 && (
            <span className="ml-2 text-xs font-normal text-green-600">
              ({ldList.length} found in selected area)
            </span>
          )}
        </label>

        {!selectedDistrict ? (
          <p className="text-sm text-gray-400 italic">Select district first</p>
        ) : (
          <div className="relative" ref={searchRef}>
            <input
              type="text"
              value={ldSearch}
              onChange={e => { setLdSearch(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Type LD name to search..."
              className="w-full border border-green-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            />

            {showDropdown && filteredLds.length > 0 && (
              <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                {filteredLds.slice(0, 50).map((entry, i) => {
                  const isSurveyed = surveyedCodes.has(entry.ld_code)
                  return isSurveyed ? (
                    /* Non-selectable row for already-surveyed LDs */
                    <div
                      key={i}
                      className="w-full px-4 py-2.5 border-b border-gray-50 last:border-0 bg-gray-50 cursor-not-allowed select-none"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-400 truncate">{entry.ld_name}</p>
                        <span className="shrink-0 text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          ✓ Surveyed
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-0.5">{entry.shg_name} · {entry.panchayat}</p>
                    </div>
                  ) : (
                    /* Selectable row */
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => selectLD(entry)}
                      className="w-full text-left px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-green-50 transition-colors"
                    >
                      <p className="text-sm font-semibold text-gray-800 truncate">{entry.ld_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{entry.shg_name} · {entry.panchayat}</p>
                    </button>
                  )
                })}
                {filteredLds.length > 50 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    {filteredLds.length - 50} more — type more to narrow down
                  </p>
                )}
              </div>
            )}

            {showDropdown && ldSearch && filteredLds.length === 0 && (
              <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
                No Lakhpati Didi found matching "{ldSearch}"
              </div>
            )}
          </div>
        )}

        {/* Hidden registered fields */}
        <input type="hidden" {...register('ld_name', { required: 'Lakhpati Didi selection is required' })} />
        {errors.ld_name && <p className="text-red-500 text-xs mt-1">{errors.ld_name.message}</p>}
      </div>

      {/* Auto-filled fields — shown read-only once LD is selected */}
      {watch('ld_name') && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Auto-filled from Master Data</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ReadOnly label="LD Name" value={watch('ld_name')} />
            <ReadOnly label="LD Code" value={watch('ld_code')} />
            <ReadOnly label="SHG Name" value={watch('shg_name')} />
            <ReadOnly label="SHG Code" value={watch('shg_code')} />
            <ReadOnly label="Village" value={watch('village')} />
          </div>
          <input type="hidden" {...register('ld_code')} />
          <input type="hidden" {...register('shg_name')} />
          <input type="hidden" {...register('shg_code')} />
          <input type="hidden" {...register('village')} />
        </div>
      )}

      {/* Additional fields — 2 cols on mobile, 4 cols on lg+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Num n="1.5" />Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            {...register('mobile', {
              required: 'Mobile number is required',
              pattern: { value: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit mobile number' },
            })}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            onKeyDown={blockNonNumeric}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="10-digit mobile number"
          />
          {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Num n="1.6" />Social Category <span className="text-red-500">*</span>
          </label>
          <select
            {...register('social_category', { required: 'Social category is required' })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Select --</option>
            {SOCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.social_category && <p className="text-red-500 text-xs mt-1">{errors.social_category.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Num n="1.7" />Household Size <span className="text-red-500">*</span>
          </label>
          <input
            {...register('household_size', {
              required: 'Required',
              min: { value: 1, message: 'Min 1' },
              valueAsNumber: true,
            })}
            type="number"
            inputMode="numeric"
            min={1}
            onKeyDown={blockNonNumeric}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="No. of members"
          />
          {errors.household_size && <p className="text-red-500 text-xs mt-1">{errors.household_size.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Num n="1.8" />Earning Members <span className="text-red-500">*</span>
          </label>
          <input
            {...register('earning_members', {
              required: 'Required',
              min: { value: 0, message: 'Min 0' },
              valueAsNumber: true,
            })}
            type="number"
            inputMode="numeric"
            min={0}
            onKeyDown={blockNonNumeric}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="No. of earning members"
          />
          {errors.earning_members && <p className="text-red-500 text-xs mt-1">{errors.earning_members.message}</p>}
        </div>
      </div>
    </div>
  )
}

function ReadOnly({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2">
        {value || '—'}
      </p>
    </div>
  )
}
