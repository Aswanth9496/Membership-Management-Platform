import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminEndpoints } from '../../data/admin'

const AdminForgotPassword = () => {
    const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    })
    const [resetToken, setResetToken] = useState('')
    const [resendTimer, setResendTimer] = useState(0)

    const navigate = useNavigate()

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setInterval(() => setResendTimer(t => t - 1), 1000)
            return () => clearInterval(timer)
        }
    }, [resendTimer])

    const handleRequestOTP = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const res = await adminEndpoints.auth.forgotPassword(email)
            if (res.success) {
                setStep(2)
                setResendTimer(60)
                setSuccess('OTP sent to your admin email')
            } else {
                setError(res.message || 'Failed to send OTP')
            }
        } catch (err) {
            const errMsg = err.data?.errors?.[0] || err.message || 'Failed to send OTP. Please try again.'
            setError(errMsg)
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOTP = async (e) => {
        e.preventDefault()
        if (otp.length !== 6) {
            setError('Please enter the 6-digit OTP')
            return
        }
        setLoading(true)
        setError(null)
        try {
            const res = await adminEndpoints.auth.verifyOTP(email, otp)
            if (res.success) {
                setResetToken(res.data.resetToken)
                setStep(3)
                setSuccess('OTP verified! Secure your admin account with a new password.')
            } else {
                setError(res.message || 'Verification failed')
            }
        } catch (err) {
            const errMsg = err.data?.errors?.[0] || err.message || 'Invalid OTP. Please try again.'
            setError(errMsg)
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('Passwords do not match')
            return
        }
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
        if (passwords.newPassword.length < 8) {
            setError('Password must be at least 8 characters long')
            return
        }
        if (!passwordRegex.test(passwords.newPassword)) {
            setError('Password must contain at least one uppercase letter, one lowercase letter, and one number')
            return
        }

        setLoading(true)
        setError(null)
        try {
            const res = await adminEndpoints.auth.resetPassword({
                resetToken,
                newPassword: passwords.newPassword,
                confirmPassword: passwords.confirmPassword
            })
            if (res.success) {
                setSuccess('Admin password reset successfully! Redirecting to login...')
                setTimeout(() => navigate('/admin/login'), 3000)
            } else {
                setError(res.message || 'Failed to reset password')
            }
        } catch (err) {
            const errMsg = err.data?.errors?.[0] || err.message || 'Failed to reset password.'
            setError(errMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center relative p-4 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(240,241,242,0.92)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute w-[600px] h-[600px] -top-[150px] -right-[100px] rounded-full bg-blue-200/30 blur-[90px] animate-pulse" />
            <div className="absolute w-[400px] h-[400px] bottom-0 left-[5%] rounded-full bg-indigo-200/40 blur-[90px] animate-pulse" style={{ animationDelay: '2.5s' }} />

            {/* Container */}
            <div className="w-full max-w-[420px] animate-fadeUp z-10">
                <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-3xl p-10 relative overflow-hidden backdrop-blur-xl shadow-2xl hover:border-blue-300 transition-all duration-300">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-2.5 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-lg shadow-lg shadow-blue-500/50 text-white">
                                🏛️
                            </div>
                            <span className="font-syne font-bold text-2xl text-gray-900 tracking-tight">Admin<span className="text-blue-600">Recovery</span></span>
                        </div>
                        <div className="inline-block px-3 py-1 bg-blue-100 border border-blue-200 rounded-md text-[10px] font-bold text-blue-700 tracking-widest uppercase mb-4">
                            Secure Access Reset
                        </div>
                        <p className="text-gray-600 text-sm font-medium">
                            {step === 1 && "Enter your admin email to receive an OTP"}
                            {step === 2 && "Verification code sent to email"}
                            {step === 3 && "Set a strong new password"}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs text-center animate-shake">
                            {error}
                        </div>
                    )}

                    {success && !error && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs text-center animate-fadeIn">
                            {success}
                        </div>
                    )}

                    {/* Step 1: Email Input */}
                    {step === 1 && (
                        <form onSubmit={handleRequestOTP} className="space-y-6">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2 tracking-wide">Admin Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-5 py-4 text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-500"
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl px-6 py-4 font-bold text-sm tracking-wide transition-all hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Send Recovery OTP'}
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2 tracking-wide">Enter 6-digit OTP</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-5 py-5 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
                                    placeholder="••••••"
                                    required
                                />
                                <p className="text-[11px] text-gray-500 mt-3 text-center">OTP sent to <strong>{email}</strong></p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl px-6 py-4 font-bold text-sm tracking-wide shadow-md shadow-blue-500/20"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Verify Admin Identity'}
                            </button>

                            <button
                                type="button"
                                disabled={resendTimer > 0 || loading}
                                onClick={handleRequestOTP}
                                className="w-full text-blue-600 text-xs font-bold uppercase tracking-widest hover:text-blue-500 disabled:text-gray-400"
                            >
                                {resendTimer > 0 ? `Resend available in ${resendTimer}s` : 'Resend OTP Code'}
                            </button>
                        </form>
                    )}

                    {/* Step 3: New Password */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2 tracking-wide">New Admin Password</label>
                                <input
                                    type="password"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords(prev => ({...prev, newPassword: e.target.value}))}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-5 py-4 text-gray-900 text-sm focus:outline-none focus:border-blue-500 placeholder:text-gray-500"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2 tracking-wide">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords(prev => ({...prev, confirmPassword: e.target.value}))}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-5 py-4 text-gray-900 text-sm focus:outline-none focus:border-blue-500 placeholder:text-gray-500"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl px-6 py-4 font-bold text-sm tracking-wide shadow-lg shadow-blue-500/40"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Update Admin Credentials'}
                            </button>
                        </form>
                    )}

                    <div className="text-center mt-8">
                        <Link to="/admin/login" className="text-gray-600 text-sm hover:text-blue-600 transition-colors duration-200 inline-flex items-center gap-2">
                            ← Back to Admin Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminForgotPassword
