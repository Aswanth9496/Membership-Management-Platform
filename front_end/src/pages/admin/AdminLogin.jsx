import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { adminEndpoints } from '../../data/admin'
import { adminLogin } from '../../store/authSlice'

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const validateForm = () => {
    const newErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      const response = await adminEndpoints.auth.login({
        email: formData.email.trim(),
        password: formData.password
      })
      console.log(response)

      if (response?.success) {
        // Dispatch Redux action with correct response structure
        dispatch(adminLogin({
          user: response.data.admin,
        }))
        // Redirect to admin dashboard
        navigate('/admin')
      } else {
        // Handle specific error messages from backend
        const errorMessage = response?.message || 'Login failed. Please try again.'
        setApiError(errorMessage)
      }
    } catch (err) {
      console.error('Login error:', err)
      let errorMessage = 'Connection error. Please try again.'

      // Handle specific error cases
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Invalid email or password'
        } else if (err.response.status === 404) {
          errorMessage = 'Admin not found'
        } else if (err.response.status === 500) {
          errorMessage = 'Server error. Please try again later.'
        }
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.'
      }

      setApiError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden relative p-[60px_20px]">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(37,99,235,0.15)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute w-[600px] h-[600px] -top-[150px] -right-[100px] rounded-full bg-blue-500/20 blur-[90px] animate-pulse" />
      <div className="absolute w-[400px] h-[400px] bottom-0 left-[5%] rounded-full bg-blue-900/30 blur-[90px] animate-pulse" style={{ animationDelay: '2.5s' }} />

      {/* Login Container */}
      <div className="animate-fadeUp">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-white/10 rounded-3xl p-12 relative overflow-hidden backdrop-blur-xl shadow-2xl max-w-[420px] w-full hover:border-blue-500/25 transition-all duration-300">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-lg shadow-lg shadow-blue-500/50">
                🏛️
              </div>
              <span className="font-syne font-bold text-2xl text-white tracking-tight">Admin<span className="text-blue-400">Portal</span></span>
            </div>
            <div className="inline-block px-3 py-1 bg-blue-500/12 border border-blue-500/25 rounded-md text-xs font-medium text-blue-300 tracking-widest uppercase mb-6">
              Administrator Access
            </div>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 0 8 8 0 0116 0zm-3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.293-7.293a1 1 0 00-1.414 0L10.586 9l7.293 7.293a1 1 0 001.414 1.414L10 13.414l-7.293 7.293a1 1 0 001.414 0L13.414 11l7.293-7.293a1 1 0 001.414 1.414L10 16.586l7.293 7.293a1 1 0 001.414 0L16.586 14l7.293 7.293a1 1 0 001.414 1.414L10 19.586l7.293 7.293a1 1 0 001.414 0z" clipRule="evenodd" />
                </svg>
                {apiError}
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="animate-fadeUp" style={{ animationDelay: '0.2s' }}>
              <div className="mb-6">
                <label className="block text-slate-300 text-sm font-medium mb-2 tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-white/5 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl px-5 py-4 text-white text-sm font-inter transition-all duration-300 focus:outline-none focus:border-blue-500 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] placeholder:text-slate-500`}
                  placeholder="admin@example.com"
                  required
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 011-2h2a1 1 0 110 2 1 1 0 011-2zm-1-4a1 1 0 00-1 1H7a1 1 0 000 1v2a1 1 0 001 1h8a1 1 0 001-1v-2a1 1 0 00-1-1zm-2 0a1 1 0 00-1 1H7a1 1 0 000-1h8a1 1 0 001 1v2a1 1 0 001-1h8a1 1 0 001-1v-2z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-slate-300 text-sm font-medium mb-2 tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-white/5 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-xl px-5 py-4 text-white text-sm font-inter transition-all duration-300 focus:outline-none focus:border-blue-500 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] placeholder:text-slate-500`}
                  placeholder="Enter your password"
                  required
                />
                {errors.password && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 011-2h2a1 1 0 110 2 1 1 0 011-2zm-1-4a1 1 0 00-1 1H7a1 1 0 000 1v2a1 1 0 001 1h8a1 1 0 001-1v-2a1 1 0 00-1-1zm-2 0a1 1 0 00-1 1H7a1 1 0 000-1h8a1 1 0 001 1v2a1 1 0 001-1h8a1 1 0 001-1v-2z" clipRule="evenodd" />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <div className="animate-fadeUp" style={{ animationDelay: '0.4s' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white border-none rounded-xl px-6 py-4 font-inter font-semibold text-sm tracking-wide cursor-pointer transition-all duration-250 relative overflow-hidden shadow-lg shadow-blue-500/40 hover:transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/65 active:transform active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 8 8 0 0116 0 8 8 0 0116 0" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In to Admin Portal'
                )}
              </button>
            </div>
          </form>

          {/* Back Link */}
          <div className="text-center mt-8">
            <Link to="/" className="text-slate-500 text-sm hover:text-blue-400 transition-colors duration-200 inline-flex items-center gap-2">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
