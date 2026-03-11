import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { memberEndpoints } from '../../data/member'

const UpdateRequests = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState(null)
  const [requestData, setRequestData] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const fetchRequestStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await memberEndpoints.profileUpdates.getStatus()
      if (response && response.success) {
        setRequestData(response.data)
      } else {
        setError(response?.message || 'Failed to fetch request status')
      }
    } catch (err) {
      console.error('Error fetching request status:', err)
      const errorMsg = err.message || err.data?.message || 'Error connecting to server'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequestStatus()
  }, [])

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel this update request? Any unsaved changes will be lost.')) return

    try {
      setCancelLoading(true)
      setError(null)
      const response = await memberEndpoints.profileUpdates.cancelRequest()
      if (response && response.success) {
        setSuccessMessage(response.message || 'Update request cancelled successfully')
        setRequestData(prev => ({
          ...prev,
          hasPendingRequest: false,
          request: null
        }))
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setError(response?.message || 'Failed to cancel request')
      }
    } catch (err) {
      console.error('Error cancelling request:', err)
      const errorMsg = err.message || err.data?.message || 'Error connecting to server'
      setError(errorMsg)
    } finally {
      setCancelLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeUp p-2 md:p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <button 
             onClick={() => navigate('/member/profile')}
             className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm group font-bold"
           >
             ←
           </button>
           <div>
             <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-none mb-1">Update Requests</h2>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Track & Manage Profile Changes</p>
           </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-xs font-bold flex items-center gap-3 animate-fadeIn">
          <span>✅</span> {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-3 animate-shake">
          <span>⚠️</span> {error}
        </div>
      )}

      {requestData?.hasPendingRequest ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Status: {requestData.request.status}</span>
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Pending Profile Update</h3>
                <p className="text-xs text-slate-500 font-medium max-w-md">Your request is currently in the queue for administrative review and verification.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:text-right">
                <div className="space-y-1">
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Requested At</p>
                  <p className="text-xs font-bold text-slate-700">{new Date(requestData.request.requestedAt).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Pending For</p>
                  <p className="text-xs font-bold text-slate-700">{requestData.request.pendingFor}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100/50 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">🕒</div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none mb-1">Administrative Verification</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Standard review period: 24-48 business hours.</p>
                </div>
              </div>
              
              <button
                onClick={handleCancelRequest}
                disabled={cancelLoading}
                className="w-full md:w-auto px-8 py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
              >
                {cancelLoading ? 'Processing...' : 'Cancel Request'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center space-y-4 shadow-sm">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mx-auto opacity-50">📁</div>
           <div className="space-y-1">
             <h3 className="text-lg font-black text-slate-800">No Pending Requests</h3>
             <p className="text-xs text-slate-500 font-medium">You don't have any active profile modification requests at this time.</p>
           </div>
           <button 
             onClick={() => navigate('/member/profile/edit')}
             className="inline-flex px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
           >
             Edit Profile Now
           </button>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="max-w-lg space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Policy Information</h4>
              <p className="text-sm font-bold text-slate-100 tracking-tight">Why do my changes need approval?</p>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                To maintain the integrity of our association database, all modifications to core membership data must be manually verified by the administrative team. This ensures all member information remains accurate and valid.
              </p>
           </div>
           
           <div className="flex -space-x-3">
              {[1,2,3].map(i => (
                <div key={i} className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center font-bold text-xs ring-4 ring-slate-900/50 shadow-2xl">
                   {i === 1 ? '👨‍💻' : i === 2 ? '🔒' : '✅'}
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}

export default UpdateRequests
