import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { memberEndpoints } from '../../data/member'
import { memberLogin } from '../../store/authSlice'

const MemberLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const response = await memberEndpoints.auth.login(formData)
      if (response && response.success) {
        // Store user data in Redux
        dispatch(memberLogin({ member: response.data.member }))
        // Navigate to profile
        navigate('/member/profile')
      } else {
        setError(response?.message || 'Invalid email or password')
      }
    } catch (err) {
      console.error('Member login error:', err)
      setError('An error occurred. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative p-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(37,99,235,0.15)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute w-[500px] h-[500px] -top-[100px] -right-[50px] rounded-full bg-blue-500/10 blur-[100px] animate-pulse" />
      <div className="absolute w-[400px] h-[400px] -bottom-[50px] -left-[50px] rounded-full bg-blue-900/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Login Container */}
      <div className="w-full max-w-[400px] animate-fadeUp z-10">
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl hover:border-blue-500/20 transition-all duration-500">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-xl shadow-lg shadow-blue-500/30">
                👤
              </div>
              <span className="font-syne font-bold text-2xl text-white tracking-tight">Member<span className="text-blue-400">Portal</span></span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Welcome back! Please sign in.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center animate-shake">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm transition-all focus:outline-none focus:border-blue-500 focus:bg-white/[0.08] placeholder:text-slate-600"
                placeholder="Enter your registered email"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm transition-all focus:outline-none focus:border-blue-500 focus:bg-white/[0.08] placeholder:text-slate-600"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex justify-end">
              <Link to="/member/forgot-password" size="sm" className="text-blue-400 text-xs font-semibold hover:text-blue-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl px-6 py-4 font-bold text-sm tracking-wide transition-all hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
            <p className="text-center text-slate-500 text-xs">
              Don't have an account?{' '}
              <Link to="/member/register" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
                Register here
              </Link>
            </p>
            
            <Link to="/" className="flex items-center justify-center gap-2 text-slate-600 text-xs hover:text-blue-400 transition-colors">
              <span>←</span> Back to Main Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberLogin
