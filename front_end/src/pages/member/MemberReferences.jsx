import React, { useState, useEffect } from 'react'
import { memberEndpoints } from '../../data/member'

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-100 text-amber-600 border-amber-200',
    confirmed: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    approved: 'bg-emerald-100 text-emerald-600 border-emerald-200', // for submissions
    rejected: 'bg-red-100 text-red-600 border-red-200',
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles.pending}`}>
      {status}
    </span>
  )
}

const EmptyState = ({ icon, title, message }) => (
  <div className="py-20 text-center animate-fadeUp">
    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-3xl mx-auto mb-4 grayscale opacity-50">
      {icon}
    </div>
    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{title}</h4>
    <p className="text-[11px] text-slate-400 font-medium">{message}</p>
  </div>
)

const MemberReferences = () => {
    const [incomingRequests, setIncomingRequests] = useState([])
    const [processedRequests, setProcessedRequests] = useState([])
    const [mySubmissions, setMySubmissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') 
    const [processingId, setProcessingId] = useState(null)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [allRes, subRes] = await Promise.all([
                memberEndpoints.references.getAll(),
                memberEndpoints.references.getMySubmissions()
            ])

            if (allRes.success) {
                const reqs = allRes.data.requests
                setIncomingRequests(reqs.filter(r => r.status === 'pending'))
                setProcessedRequests(reqs.filter(r => r.status !== 'pending'))
            }

            if (subRes.success) {
                setMySubmissions(subRes.data.requests)
            }
        } catch (err) {
            console.error('Failed to fetch reference data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleAction = async (requestId, action) => {
        setProcessingId(requestId)
        try {
            const response = action === 'confirm' 
                ? await memberEndpoints.references.confirm(requestId)
                : await memberEndpoints.references.reject(requestId)
            
            if (response.success) {
                // Refresh data
                await fetchData()
            }
        } catch (err) {
            console.error(`Failed to ${action} reference:`, err)
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Records...</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-fadeUp">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Reference Dashboard</h2>
                    <p className="text-sm text-slate-500 font-medium">Verify peer members and track your own application references.</p>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {['all', 'pending', 'confirmed', 'rejected'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section A: Pending Requests */}
            {(filter === 'all' || filter === 'pending') && incomingRequests.length > 0 && (
                <section className="animate-fadeUp">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Pending Requests</h3>
                        <span className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-black rounded-full uppercase">Action Required</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {incomingRequests.map((req) => (
                            <div key={req._id} className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                        👤
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-300 uppercase">
                                        {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-slate-800 mb-1">{req.applicantId?.member?.fullName}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{req.applicantId?.establishment?.name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium truncate italic">{req.applicantId?.email}</p>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleAction(req._id, 'confirm')}
                                        disabled={processingId === req._id}
                                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                                    >
                                        {processingId === req._id ? '...' : 'Approve'}
                                    </button>
                                    <button 
                                        onClick={() => handleAction(req._id, 'reject')}
                                        disabled={processingId === req._id}
                                        className="flex-1 py-3 bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Section B: Reference History */}
            {processedRequests.length > 0 && (
                <section className="animate-fadeUp">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="w-1.5 h-6 bg-slate-800 rounded-full"></div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">History</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Decisions you have already made</p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Applicant</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Decision</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {processedRequests
                                        .filter(r => filter === 'all' || r.status === filter)
                                        .map((req) => (
                                        <tr key={req._id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">{req.applicantId?.member?.fullName}</p>
                                                    <p className="text-[10px] font-medium text-slate-400">{req.applicantId?.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <StatusBadge status={req.status} />
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">
                                                    {new Date(req.verifiedAt || req.updatedAt).toLocaleDateString()}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {processedRequests.filter(r => filter === 'all' || r.status === filter).length === 0 && (
                                <EmptyState icon="📂" title="No matching history" message="Try adjusting your filters." />
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Section C: References You Provided */}
            {filter === 'all' && (
                <section className="animate-fadeUp pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Your Submitted References</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Tracking status of members who verify YOU</p>
                    </div>

                    {mySubmissions.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {mySubmissions.map((sub) => (
                                <div key={sub._id} className="bg-slate-50/50 border border-slate-100 rounded-[24px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-lg text-slate-400">
                                            🏢
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{sub.referencedMemberId?.member?.fullName}</h4>
                                            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{sub.referencedMemberId?.establishment?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:items-end gap-1.5">
                                        <StatusBadge status={sub.status} />
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                            Requested {new Date(sub.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon="🛡️" title="No Outgoing References" message="You didn't list any references during your registration." />
                    )}
                </section>
            )}

            {/* Global Empty State */}
            {!loading && incomingRequests.length === 0 && processedRequests.length === 0 && mySubmissions.length === 0 && (
                <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-10 bg-white border border-slate-100 rounded-[48px]">
                    <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-5xl mb-6 grayscale opacity-30">
                        📄
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Your Dashboard is Clear</h3>
                    <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">
                        No reference requests found. When other members mention you or when you list references, they will appear here.
                    </p>
                </div>
            )}
        </div>
    )
}

export default MemberReferences
