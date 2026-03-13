import { useState, useEffect } from 'react'
import { adminEndpoints } from '../../data/admin'

const AdminReferenceRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      const response = await adminEndpoints.references.getAll()
      if (response.success) {
        setRequests(response.data.requests)
      }
    } catch (err) {
      console.error('Failed to fetch reference requests for admin:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  if (loading) return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
      <p className="text-gray-500 text-sm">Loading reference requests...</p>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50/30 flex justify-between items-center">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Reference Verification Requests</h3>
          <p className="text-xs text-gray-500 mt-0.5">Track verification status between applicants and their references</p>
        </div>
        <div className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
          {requests.length} Total
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              <th className="px-6 py-4">Applicant</th>
              <th className="px-6 py-4">Reference Member</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length > 0 ? (
              requests.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-gray-800 uppercase leading-none mb-1">
                      {request.applicantId?.member?.fullName || 'N/A'}
                    </p>
                    <p className="text-[10px] font-medium text-gray-500 italic">
                      {request.applicantId?.establishment?.name || 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-gray-700 uppercase leading-none mb-1">
                      {request.referencedMemberId?.member?.fullName || 'N/A'}
                    </p>
                    <p className="text-[10px] font-semibold text-sky-600">
                      ID: {request.referencedMemberId?.membershipNumber || 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-tight ${
                      request.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      request.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                      'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {request.status === 'confirmed' ? 'Verified' : 
                       request.status === 'rejected' ? 'Rejected' : 
                       'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-400 text-sm">
                  No reference verification requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminReferenceRequests
