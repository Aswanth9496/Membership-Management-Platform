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
        // Backend returns { success: true, data: { requests: [...] } }
        // We ensure we access the requests array correctly
        const requestsData = response.data?.requests || []
        const mapped = requestsData.map(req => ({
          id: req.id,
          userId: req.userId,
          userName: req.memberDetails?.fullName || 'N/A',
          email: req.memberDetails?.email || 'N/A',
          establishment: req.memberDetails?.establishmentName || 'N/A',
          requestedAt: req.changeRequest?.requestedAt,
          status: req.changeRequest?.status || 'pending'
        }))
        setRequests(mapped)
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
    if (!admin || !admin.isAuthenticated) {
      navigate('/admin/login')
      return
    }
    fetchRequests()
  }, [navigate, admin?.isAuthenticated])

  const handleReview = async (request) => {
    try {
      setActionLoading(true)
      const response = await adminEndpoints.profileUpdates.getDetails(request.id)
      if (response && response.success) {
        const { currentData, requestedData: changes } = response.data
        
        // Build a complete "requested" profile by merging changes into a current copy
        const requestedData = JSON.parse(JSON.stringify(currentData))
        
        const deepMerge = (target, source) => {
          if (!source) return
          Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && !(source[key] instanceof Date)) {
              if (!target[key]) target[key] = {}
              deepMerge(target[key], source[key])
            } else {
              target[key] = source[key]
            }
          })
        }
        
        deepMerge(requestedData, changes)

        setSelectedRequest({
          ...request,
          currentData,
          requestedData
        })
        setShowReviewModal(true)
        setRejectionReason('')
      }
    } catch (err) {
      console.error('Error fetching details:', err)
      alert('Failed to load request details')
    } finally {
      setActionLoading(false)
    }
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
        remarks: action === 'reject' ? rejectionReason : undefined
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

  // Human-readable section definitions to replace "coding setup"
  const MODAL_SECTIONS = [
    {
      title: 'Establishment Details',
      fields: [
        { label: 'Agency Name', path: 'establishment.name' },
        { label: 'Trade Name', path: 'establishment.tradeName' },
        { label: 'Year of Establishment', path: 'establishment.yearOfEstablishment' },
        { label: 'Official Classification', path: 'establishment.officialClassification' },
        { label: 'Business Type', path: 'establishment.businessType' },
        { label: 'Official Email', path: 'establishment.officialEmail' },
        { label: 'Website', path: 'establishment.website' },
        { label: 'GST Registered', path: 'establishment.gstRegistered' },
        { label: 'GST Number', path: 'establishment.gstNumber' },
      ]
    },
    {
      title: 'Location Information',
      fields: [
        { label: 'State', path: 'location.state' },
        { label: 'District', path: 'location.district' },
        { label: 'Region', path: 'location.region' },
        { label: 'City', path: 'location.city' },
        { label: 'Registered Address', path: 'location.registeredAddress' },
        { label: 'Communication Address', path: 'location.communicationAddress' },
        { label: 'Addresses Same?', path: 'location.isSameAddress' },
        { label: 'Pin Code', path: 'location.pinCode' },
      ]
    },
    {
      title: 'Member Information',
      fields: [
        { label: 'Full Name', path: 'member.fullName' },
        { label: 'Role in Agency', path: 'member.roleInAgency' },
        { label: 'Office Type', path: 'member.officeType' },
        { label: 'Mobile Number', path: 'member.mobile' },
        { label: 'Landline', path: 'member.landline' },
        { label: 'Date of Birth', path: 'member.dateOfBirth' },
      ]
    },
    {
      title: 'Partner Details',
      fields: [
        { label: 'Partner Name', path: 'partner.name' },
        { label: 'Partner Mobile', path: 'partner.mobile' },
      ]
    },
    {
      title: 'Staff Details',
      fields: [
        { label: 'Staff Name', path: 'staff.name' },
        { label: 'Staff Mobile', path: 'staff.mobile' },
      ]
    },
    {
      title: 'Documents & Remarks',
      fields: [
        { label: 'Shop Photo', path: 'documents.shopPhoto' },
        { label: 'Identity Proof', path: 'documents.idProof' },
        { label: 'Address Proof', path: 'documents.agencyAddressProof' },
        { label: 'Business License', path: 'documents.activityLicense' },
        { label: 'Business Card', path: 'documents.businessCard' },
        { label: 'Agency Logo', path: 'documents.agencyLogo' },
        { label: 'Member Photo', path: 'documents.memberPhoto' },
        { label: 'Admin Remarks/Note', path: 'remarks' },
      ]
    }
  ]

  const getValueByPath = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj)
  }

  const renderComparisonTable = (current, requested) => {
    return (
      <div className="space-y-6">
        {MODAL_SECTIONS.map((section, sIdx) => {
          return (
            <div key={sIdx} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{section.title}</h3>
              </div>
              <table className="w-full text-[11px] border-collapse">
                <thead className="bg-slate-50/50">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-2 text-left font-bold text-slate-500 w-1/4 border-r border-slate-200 text-[10px] uppercase">Name</th>
                    <th className="px-4 py-2 text-left font-bold text-slate-500 w-3/8 border-r border-slate-200 text-[10px] uppercase">Current</th>
                    <th className="px-4 py-2 text-left font-bold text-blue-600 w-3/8 text-[10px] uppercase">Requested</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {section.fields.map((field, fIdx) => {
                    const curr = getValueByPath(current, field.path)
                    const req = getValueByPath(requested, field.path)
                    
                    const isChanged = JSON.stringify(curr) !== JSON.stringify(req)
                    const isDoc = field.path.startsWith('documents') || field.label.toLowerCase().includes('photo') || field.label.toLowerCase().includes('proof') || field.label.toLowerCase().includes('license')

                    // Format documents and values display
                    const formatValue = (val, isFieldDoc) => {
                      if (val === null || val === undefined || val === '') return '-'
                      
                      // Handle Booleans
                      if (typeof val === 'boolean') return val ? 'Yes' : 'No'
                      
                      // Handle Dates
                      if (val && (val.$date || (typeof val === 'string' && !isNaN(Date.parse(val)) && val.includes('-')))) {
                        const dateStr = val.$date || val
                        try {
                          return new Date(dateStr).toLocaleDateString()
                        } catch (e) {
                          return 'N/A'
                        }
                      }

                      if (isFieldDoc) {
                        // Handle potential array (like shopPhoto)
                        if (Array.isArray(val)) {
                          return (
                            <div className="flex flex-wrap gap-2">
                              {val.map((file, i) => (
                                <a key={i} href={file.url} target="_blank" rel="noreferrer" className="text-blue-500 underline font-bold uppercase text-[9px]">FILE {i+1}</a>
                              ))}
                            </div>
                          )
                        }
                        // Handle single document object/string
                        const url = typeof val === 'object' ? val.url : val
                        return <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 underline font-bold uppercase text-[9px]">VIEW DOCUMENT</a>
                      }
                      return String(val)
                    }

                    return (
                      <tr key={fIdx} className={isChanged ? 'bg-blue-50/20' : ''}>
                        <td className={`px-4 py-2 font-bold border-r border-slate-200 ${isChanged ? 'text-blue-600' : 'text-slate-500'}`}>{field.label}</td>
                        <td className={`px-4 py-2 border-r border-slate-200 ${isChanged ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                          {formatValue(curr, isDoc)}
                        </td>
                        <td className={`px-4 py-2 font-bold ${isChanged ? 'text-blue-800 bg-blue-50' : 'text-slate-600'}`}>
                          {formatValue(req, isDoc)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading profile updates...</p>
    </div>
  )

  return (
    <div className="p-6 bg-slate-50 min-h-screen" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Profile Update Requests</h1>
            <p className="text-xs text-slate-500 italic">Review pending member synchronization requests</p>
          </div>
          <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded border border-blue-100">
            {requests.length} Pending
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-widest text-[10px]">Member</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-widest text-[10px]">Establishment</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-widest text-[10px]">Date Submitted</th>
                <th className="px-4 py-3 text-right font-bold text-slate-600 uppercase tracking-widest text-[10px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length > 0 ? (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{request.userName}</p>
                      <p className="text-[10px] text-slate-400">{request.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{request.establishment}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {request.requestedAt ? `${new Date(request.requestedAt).toLocaleDateString()} ${new Date(request.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleReview(request)}
                        disabled={actionLoading}
                        className="px-4 py-1.5 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-blue-600 transition-all disabled:opacity-50"
                      >
                        {actionLoading ? '...' : 'Review'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">No pending requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Review Request: {selectedRequest.userName}</h2>
                <p className="text-[10px] text-slate-500 italic">Carefully compare current data with member-requested updates before syncing</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-red-500 text-lg">✕</button>
            </div>

            <div className="p-6 overflow-y-auto bg-white">
              <div className="mb-6">
                {renderComparisonTable(selectedRequest.currentData, selectedRequest.requestedData)}
              </div>

              <div className="p-5 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 italic">Rejection Justification (Required if rejecting)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State the reason for rejection clearly..."
                  className="w-full px-4 py-3 border border-slate-200 rounded text-xs font-medium focus:outline-none focus:border-blue-500 min-h-[80px]"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-100 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                onClick={() => handleAction('reject')}
                disabled={actionLoading}
                className="px-6 py-2 bg-white text-red-600 border border-red-100 text-[10px] font-bold uppercase tracking-widest rounded hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
              >
                Reject Request
              </button>
              <button
                onClick={() => handleAction('approve')}
                disabled={actionLoading}
                className="px-8 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                Approve & Sync ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileUpdateRequests
