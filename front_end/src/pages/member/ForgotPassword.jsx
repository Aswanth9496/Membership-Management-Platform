import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { memberEndpoints } from '../../data/member'

const ForgotPassword = () => {
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
            const res = await memberEndpoints.auth.forgotPassword(email)
            if (res.success) {
                setStep(2)
                setResendTimer(60)
                setSuccess('OTP sent to your email')
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
            const res = await memberEndpoints.auth.verifyOTP(email, otp)
            if (res.success) {
                setResetToken(res.data.resetToken)
                setStep(3)
                setSuccess('OTP verified! Now set your new password.')
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
        
        // Match backend regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
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
            const res = await memberEndpoints.auth.resetPassword({
                resetToken,
                newPassword: passwords.newPassword,
                confirmPassword: passwords.confirmPassword
            })
            if (res.success) {
                setSuccess('Password reset successfully! Redirecting to login...')
                setTimeout(() => navigate('/member/login'), 3000)
            } else {
                setError(res.message || 'Failed to reset password')
            }
        } catch (err) {
            const errMsg = err.data?.errors?.[0] || err.message || 'Failed to reset password. Please try again.'
            setError(errMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center relative p-4 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(240,241,242,0.92)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute w-[500px] h-[500px] -top-[100px] -right-[50px] rounded-full bg-blue-200/30 blur-[100px] animate-pulse" />
            <div className="absolute w-[400px] h-[400px] -bottom-[50px] -left-[50px] rounded-full bg-indigo-200/40 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

            {/* Container */}
            <div className="w-full max-w-[400px] animate-fadeUp z-10">
                <div className="bg-white border border-gray-200 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl hover:border-blue-300 transition-all duration-500">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-xl shadow-lg shadow-blue-500/30 text-white">
                                🔑
                            </div>
                            <span className="font-syne font-bold text-2xl text-gray-900 tracking-tight">Forgot<span className="text-blue-600">Password</span></span>
                        </div>
                        <p className="text-gray-600 text-sm font-medium">
                            {step === 1 && "Recover your account access"}
                            {step === 2 && "Enter the verification code"}
                            {step === 3 && "Secure your new password"}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs text-center animate-shake">
                            {error}
                        </div>
                    )}

                    {success && !error && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs text-center animate-fadeIn">
                            {success}
                        </div>
                    )}

                    {/* Step 1: Email Input */}
                    {step === 1 && (
                        <form onSubmit={handleRequestOTP} className="space-y-5">
                            <div>
                                <label className="block text-gray-700 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Registered Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-500 focus:bg-gray-50 placeholder:text-gray-500"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white rounded-xl px-6 py-4 font-bold text-sm tracking-wide transition-all hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Send Reset OTP'}
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-5">
                            <div>
                                <label className="block text-gray-700 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Enter 6-digit OTP</label>
                                <div className="flex justify-between gap-1 mb-2">
                                     <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-4 text-center text-lg font-bold tracking-[0.5em] focus:outline-none focus:border-blue-500 transition-all"
                                        placeholder="000000"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 ml-1">An OTP has been sent to <strong>{email}</strong></p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-blue-600 text-white rounded-xl px-6 py-4 font-bold text-sm tracking-wide transition-all hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Verify Code'}
                            </button>

                            <button
                                type="button"
                                disabled={resendTimer > 0 || loading}
                                onClick={handleRequestOTP}
                                className="w-full text-blue-600 text-xs font-semibold hover:text-blue-500 disabled:opacity-50 disabled:text-gray-400"
                            >
                                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Verification Code'}
                            </button>
                        </form>
                    )}

                    {/* Step 3: New Password */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div>
                                <label className="block text-gray-700 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">New Password</label>
                                <input
                                    type="password"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords(prev => ({...prev, newPassword: e.target.value}))}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-500 placeholder:text-gray-500"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords(prev => ({...prev, confirmPassword: e.target.value}))}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-500 placeholder:text-gray-500"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white rounded-xl px-6 py-4 font-bold text-sm tracking-wide transition-all hover:bg-blue-500 hover:-translate-y-0.5"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Update Password'}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <Link to="/member/login" className="flex items-center justify-center gap-2 text-gray-500 text-xs hover:text-blue-600 transition-colors">
                            <span>←</span> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
