import { useState, useEffect } from 'react'
import { memberEndpoints } from '../../data/member'

const ApplicantReferenceStatus = ({ hideIfEmpty = true }) => {
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchSubmissions = async () => {
        try {
            const response = await memberEndpoints.references.getMySubmissions()
            if (response.success) {
                setSubmissions(response.data.requests)
            }
        } catch (err) {
            console.error('Failed to fetch reference submissions:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSubmissions()
    }, [])

    if (loading) return null
    if (submissions.length === 0 && hideIfEmpty) return null

    if (submissions.length === 0 && !hideIfEmpty) {
        return (
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center animate-fadeUp">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-4">
                    🛡️
                </div>
                <h4 className="font-bold text-slate-800 mb-1 leading-none uppercase text-xs tracking-widest">No Submissions Found</h4>
                <p className="text-[10px] text-slate-400 font-medium">You haven't listed any members as references in your registration.</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 animate-fadeUp">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-xl">
                    🛡️
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Your Reference Status</h3>
                    <p className="text-xs text-slate-500">Track the verification status of the members you listed as references.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.map((sub) => (
                    <div key={sub._id} className="p-4 rounded-2xl border border-slate-50 bg-slate-50/30 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    sub.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' :
                                    sub.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                    'bg-amber-100 text-amber-600'
                                }`}>
                                    {sub.status}
                                </span>
                                <p className="text-[9px] font-bold text-slate-400">
                                    {new Date(sub.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                                {sub.referencedMemberId?.member?.fullName || 'Member'}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                {sub.referencedMemberId?.establishment?.name || 'Agency Name'}
                            </p>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-100/50">
                            {sub.status === 'pending' ? (
                                <p className="text-[9px] font-bold text-amber-600 block">
                                    ⏳ Verification Awaited
                                </p>
                            ) : sub.status === 'confirmed' ? (
                                <p className="text-[9px] font-bold text-emerald-600 block">
                                    ✅ Reference Confirmed
                                </p>
                            ) : (
                                <p className="text-[9px] font-bold text-red-600 block">
                                    ❌ Reference Rejected
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ApplicantReferenceStatus
