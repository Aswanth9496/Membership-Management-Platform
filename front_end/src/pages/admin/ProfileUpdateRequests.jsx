import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { adminEndpoints } from '../../data/admin'

const ProfileUpdateRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  const navigate = useNavigate()
  const admin = useSelector(state => state.auth.admin)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await adminEndpoints.profileUpdates.getAll()
      if (response && response.success) {
        setRequests(response.data.filter(req => req.status === 'pending'))
      } else {
        setError('Failed to load profile update requests')
      }
    } catch (err) {
      console.error('Error fetching requests:', err)
      setError('Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!admin.isAuthenticated) {
      navigate('/admin/login')
      return
    }
    fetchRequests()
  }, [navigate, admin.isAuthenticated])

  const handleReview = (request) => {
    setSelectedRequest(request)
    setShowReviewModal(true)
    setRejectionReason('')
  }

  const handleAction = async (action) => {
    if (!selectedRequest) return
    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Rejection reason is required')
      return
    }

    try {
      setActionLoading(true)
      const response = await adminEndpoints.profileUpdates.reviewRequest(selectedRequest.id, {
        action,
        rejectionReason: action === 'reject' ? rejectionReason : undefined
      })

      if (response && response.success) {
        setShowReviewModal(false)
        setSelectedRequest(null)
        fetchRequests()
      } else {
        alert(response.message || 'Operation failed')
      }
    } catch (err) {
      console.error(`Error during ${action}:`, err)
      alert('An error occurred. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const getChangedFields = (current, requested) => {
    const changes = []
    const flattenObject = (obj, prefix = '') => {
      const result = {}
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
          Object.assign(result, flattenObject(obj[key], `${prefix}${key}.`))
        } else {
          result[`${prefix}${key}`] = obj[key]
        }
      }
      return result
    }

    const flatCurrent = flattenObject(current)
    const flatRequested = flattenObject(requested)

    for (const key in flatRequested) {
      if (JSON.stringify(flatCurrent[key]) !== JSON.stringify(flatRequested[key])) {
        changes.push({
          field: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
          currentValue: flatCurrent[key] === null || flatCurrent[key] === undefined ? 'N/A' : String(flatCurrent[key]),
          requestedValue: String(flatRequested[key]),
        })
      }
    }
    return changes
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Profile Update Requests</h1>
        <p className="text-gray-600">Review and manage member profile update requests</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Establishment</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Request Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.length > 0 ? (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.userName}</div>
                        <div className="text-xs text-gray-500">{request.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{request.establishment}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(request.requestedAt).toLocaleDateString()} at {new Date(request.requestedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleReview(request)}
                        className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors shadow-sm"
                      >
                        Review Changes
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No pending profile update requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Review Requested Changes</h2>
                <p className="text-sm text-gray-500">Submitted by {selectedRequest.userName} ({selectedRequest.email})</p>
              </div>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={actionLoading}
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 pb-2 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div>Field</div>
                  <div>Current Value</div>
                  <div>Requested Value</div>
                </div>
                {getChangedFields(selectedRequest.currentData, selectedRequest.requestedData).map((change, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-4 py-3 border-b border-gray-50 items-center">
                    <div className="text-sm font-semibold text-gray-600">{change.field}</div>
                    <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded line-through decoration-red-300 opacity-70">
                      {change.currentValue}
                    </div>
                    <div className="text-sm font-medium text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100">
                      {change.requestedValue}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rejection Reason (Required if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this update is being rejected..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all min-h-[100px]"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-red-100 text-red-700 text-sm font-bold rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                Reject Request
              </button>
              <button
                onClick={() => handleAction('approve')}
                disabled={actionLoading}
                className="px-8 py-2.5 bg-sky-600 text-white text-sm font-bold rounded-xl hover:bg-sky-700 shadow-md shadow-sky-100 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                Approve & Update Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileUpdateRequests
