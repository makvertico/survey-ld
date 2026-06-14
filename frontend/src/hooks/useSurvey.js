import { useState, useCallback } from 'react'
import api from '../lib/api'

const PAGE_SIZE = 20

export function useSurvey() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [surveys, setSurveys] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState({
    total: 0, high: 0, medium: 0, low: 0, today: 0, by_district: [],
  })

  const submitSurvey = async (formData) => {
    setLoading(true)
    setError(null)
    try {
      await api.post('/surveys', formData)
      setLoading(false)
      return true
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.')
      setLoading(false)
      return false
    }
  }

  const fetchSurveys = useCallback(async (filters = {}, page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, ...filters }
      const { data } = await api.get('/surveys', { params })
      setSurveys(data.data)
      setTotalCount(data.total)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load surveys.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async (filters = {}) => {
    try {
      const { data } = await api.get('/surveys/stats', { params: filters })
      setStats({
        total: data.total ?? 0,
        high: data.high ?? 0,
        medium: data.medium ?? 0,
        low: data.low ?? 0,
        today: data.today ?? 0,
        by_district: data.by_district ?? [],
      })
    } catch {
      // Stats failure is non-critical — silently ignore
    }
  }, [])

  const exportSurveys = useCallback((filters = {}, format = 'csv', section = '') => {
    const token = localStorage.getItem('ld_token')
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const raw = { ...filters, ...(section ? { section } : {}) }
    const clean = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v != null && v !== '' && v !== undefined)
    )
    const params = new URLSearchParams(clean)
    fetchExportBlob(`${base}/export/${format}?${params}`, token, format)
  }, [])

  return {
    submitSurvey,
    fetchSurveys,
    fetchStats,
    exportSurveys,
    surveys,
    totalCount,
    stats,
    loading,
    error,
    PAGE_SIZE,
  }
}

async function fetchExportBlob(url, token, format) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) { alert('Export failed.'); return }

  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = `LD_Survey_Export.${format}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
}
