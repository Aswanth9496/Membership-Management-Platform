import { useState, useEffect } from 'react'
import { memberEndpoints } from '../../data/member'

const MemberReferral = () => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const fetchReferralData = async () => {
            try {
                const response = await memberEndpoints.referrals.getStats()
                if (response.success) {
                    setData(response.data)
                }
            } catch (err) {
                console.error('Failed to fetch referral data:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchReferralData()
    }, [])

    const handleCopy = () => {
        const url = `${window.location.origin}/member/register?referredBy=${data?.referralCode}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-fadeUp">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-slate-800">Referral Program</h2>
                <p className="text-sm text-slate-500">Invite other travel professionals and grow our association together.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Referral Code Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-6 backdrop-blur-md">
                                🎁
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">Your Referral Code</p>
                            <h3 className="text-3xl font-black tracking-wider mb-6">{data?.referralCode || 'REF-N/A'}</h3>
                            
                            <button 
                                onClick={handleCopy}
                                className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all backdrop-blur-md flex items-center justify-center gap-2 ${
                                    copied ? 'bg-emerald-500 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'
                                }`}
                            >
                                {copied ? '✅ Link Copied!' : '🔗 Copy Invite Link'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                        <h4 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-widest">How it works</h4>
                        <div className="space-y-6">
                            {[
                                { step: '01', text: 'Share your unique referral link with fellow travel agents.' },
                                { step: '02', text: 'They complete the registration using your code.' },
                                { step: '03', text: 'Your name appears as their referrer in the system.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <span className="text-blue-500 font-black text-xs leading-none mt-1">{item.step}</span>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Referred Members List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Referred Network</h3>
                            </div>
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                                {data?.referredMembers?.length || 0} Total
                            </span>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            {data?.referredMembers?.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Member</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agency</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.referredMembers.map((member) => (
                                            <tr key={member._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                            👤
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-700">{member.member?.fullName}</p>
                                                            <p className="text-[10px] text-slate-400 lowercase">{member.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{member.establishment?.name}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                        member.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                                        member.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                                        'bg-amber-100 text-amber-600'
                                                    }`}>
                                                        {member.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-[10px] font-bold text-slate-400">
                                                        {new Date(member.createdAt).toLocaleDateString()}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-4xl mb-4 grayscale">
                                        🤝
                                    </div>
                                    <h4 className="font-bold text-slate-800 uppercase tracking-[0.2em] text-xs">No referrals yet</h4>
                                    <p className="text-[10px] text-slate-500 font-medium max-w-xs mt-2">
                                        Share your unique referral code with travel professionals and start building your legacy.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MemberReferral
