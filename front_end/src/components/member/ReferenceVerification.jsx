import { useState, useEffect } from 'react'
import { memberEndpoints } from '../../data/member'

const ReferenceVerification = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  const fetchRequests = async () => {
    try {
      const response = await memberEndpoints.references.getMyRequests()
      if (response.success) {
        setRequests(response.data.requests)
      }
    } catch (err) {
      console.error('Failed to fetch reference requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleAction = async (requestId, action) => {
    setProcessingId(requestId)
    try {
      const response = action === 'confirm' 
        ? await memberEndpoints.references.confirm(requestId)
        : await memberEndpoints.references.reject(requestId)
      
      if (response.success) {
        // Remove from list or update local state
        setRequests(prev => prev.filter(req => req._id !== requestId))
      }
    } catch (err) {
      console.error(`Failed to ${action} reference:`, err)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) return null // Hide if loading
  if (requests.length === 0) return null // Hide if no pending requests

  return (
    <div className="bg-orange-50/50 border border-orange-100 rounded-3xl p-6 sm:p-8 animate-fadeUp">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-xl">
            📝
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Reference Verification Requests</h3>
            <p className="text-xs text-slate-500">Other professionals have listed you as a reference. Please verify them.</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
          {requests.length} Pending
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requests.map((request) => (
          <div key={request._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                  {request.applicantId?.member?.fullName || 'Unknown Applicant'}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {request.applicantId?.establishment?.name || 'Unknown Agency'}
                </p>
              </div>
              <p className="text-[9px] font-bold text-slate-300 uppercase">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAction(request._id, 'confirm')}
                disabled={processingId === request._id}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm shadow-emerald-200"
              >
                {processingId === request._id ? 'Processing...' : '✅ Confirm'}
              </button>
              <button
                onClick={() => handleAction(request._id, 'reject')}
                disabled={processingId === request._id}
                className="flex-1 py-2.5 bg-white border border-slate-100 hover:bg-slate-50 disabled:opacity-50 text-slate-400 hover:text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                {processingId === request._id ? '...' : '❌ Reject'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ReferenceVerification
