import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Login() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('ld_token', data.token)
      localStorage.setItem('ld_user', JSON.stringify(data.user))
      navigate(data.user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: '#F4F6F9' }}>

      {/* Logo + Branding */}
      <div className="text-center mb-8 anim-fade-in-up">
        <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 shadow-md flex items-center justify-center mx-auto mb-4">
          <img src="/asrlm_logo.png" alt="ASRLM" className="w-12 h-12 object-contain" />
        </div>
        <h1 className="text-gray-900 font-extrabold text-xl tracking-tight">
          Assam State Rural Livelihoods Mission
        </h1>
        <p className="text-gray-400 text-sm mt-1 font-medium">Lakhpati Didi Survey Portal</p>
      </div>

      {/* Card */}
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-md w-full max-w-sm p-6 sm:p-8 anim-fade-in-up"
        style={{ animationDelay: '80ms' }}
      >
        <div className="mb-6">
          <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Admin Sign In</h2>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">Enter your credentials to access the dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPass ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-600 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="anim-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="30 60" strokeLinecap="round" />
                </svg>
                Signing in…
              </span>
            ) : 'Sign In →'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <a href="/" className="text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors">
            ← Back to Home
          </a>
        </div>
      </div>

      <p className="text-gray-400 text-xs mt-6 font-medium">ASRLM · Government of Assam</p>
    </div>
  )
}
