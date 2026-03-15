import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { adminEndpoints } from '../../data/admin'

const MembersManagement = () => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalMembers, setTotalMembers] = useState(0)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [limit, setLimit] = useState(10)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [statusUpdateData, setStatusUpdateData] = useState({})
  const [actionLoading, setActionLoading] = useState(false)
  const [approvalRemarks, setApprovalRemarks] = useState('')
  
  const navigate = useNavigate()
  const admin = useSelector(state => state.auth.admin)

  // Status options for filter
  const statusOptions = [
    { value: '', label: 'All Members' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'verified', label: 'Verified' },
    { value: 'payment_completed', label: 'Payment Completed' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'change_requested', label: 'Change Requested' }
  ]

  // Status colors for display
  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-blue-100 text-blue-800',
      payment_completed: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      change_requested: 'bg-orange-100 text-orange-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // Reference status colors
  const getReferenceStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-50 text-amber-600 border-amber-100',
      confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      rejected: 'bg-red-50 text-red-600 border-red-100',
    }
    return colors[status] || 'bg-gray-50 text-gray-500 border-gray-100'
  }

  // Fetch members
  const fetchMembers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters = {
        status: selectedStatus || undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit,
        sortBy,
        sortOrder
      }

      const response = await adminEndpoints.members.getAll(filters)
      
      if (response?.success) {
        setMembers(response.data.members)
        setTotalPages(response.data.pagination.totalPages)
        setTotalMembers(response.data.pagination.totalMembers)
      } else {
        setError('Failed to load members')
      }
    } catch (err) {
      console.error('Error fetching members:', err)
      setError('Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  // Handle approval/rejection from officers
  const handleApprovalAction = async (action) => {
    if (!selectedMember || !action) return

    try {
      setActionLoading(true)
      const response = await adminEndpoints.members.updateApproval(selectedMember._id, {
        action,
        remarks: approvalRemarks || (action === 'approve' ? 'Approved' : 'Rejected')
      })
      
      if (response?.success) {
        await fetchMembers()
        setShowStatusModal(false)
        setSelectedMember(null)
        setApprovalRemarks('')
      }
    } catch (err) {
      console.error(`Error during ${action}:`, err)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedMember || !statusUpdateData.status) return

    try {
      setActionLoading(true)
      const response = await adminEndpoints.members.updateStatus(selectedMember._id, statusUpdateData)
      
      if (response?.success) {
        await fetchMembers()
        setShowStatusModal(false)
        setSelectedMember(null)
        setStatusUpdateData({})
      }
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle block/unblock
  const handleBlockToggle = async (member) => {
    try {
      setActionLoading(true)
      const action = member.isActive ? 'block' : 'unblock'
      const response = await adminEndpoints.members.toggleBlockStatus(member._id, { action })
      
      if (response?.success) {
        // Refresh members list
        await fetchMembers()
        setShowBlockModal(false)
        setSelectedMember(null)
      }
    } catch (err) {
      console.error('Error toggling block status:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle delete
  const handleMemberDelete = async (memberId) => {
    try {
      setActionLoading(true)
      const response = await adminEndpoints.members.deleteMember(memberId)
      
      if (response?.success) {
        await fetchMembers()
        setShowDeleteModal(false)
        setSelectedMember(null)
      }
    } catch (err) {
      console.error('Error deleting member:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Open status update modal
  const openStatusModal = (member) => {
    setSelectedMember(member)
    setStatusUpdateData({
      status: member.status,
      rejectionReason: member.rejectionReason || ''
    })
    setApprovalRemarks('')
    setShowStatusModal(true)
  }

  // Open block modal
  const openBlockModal = (member) => {
    setSelectedMember(member)
    setShowBlockModal(true)
  }

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Handle filters change
  const handleFilterChange = () => {
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Reset filters
  const resetFilters = () => {
    setSelectedStatus('')
    setSearchTerm('')
    setSortBy('createdAt')
    setSortOrder('desc')
    setCurrentPage(1)
  }

  // Check admin authentication
  useEffect(() => {
    if (!admin.isAuthenticated) {
      navigate('/admin/login')
      return
    }

    fetchMembers()
  }, [navigate, admin.isAuthenticated])

  // Refetch when filters change
  useEffect(() => {
    fetchMembers()
  }, [selectedStatus, searchTerm, currentPage, sortBy, sortOrder, limit])

  if (!admin.isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading members...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">{error}</p>
          <button 
            onClick={fetchMembers} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Members Management</h1>
          <p className="text-gray-600">Manage and monitor all member applications</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  handleFilterChange()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Members
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  handleFilterChange()
                }}
                placeholder="Search by name, email, or membership number..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  handleFilterChange()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="createdAt">Date Created</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value)
                  handleFilterChange()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset Filters
            </button>
            <div className="text-sm text-gray-600 flex items-center">
              Showing {members.length} of {totalMembers} members
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <div className="max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ref Verification
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {member.establishment.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {member.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {member.member.mobile || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                          {member.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex -space-x-2 overflow-hidden">
                          {member.referenceStatuses && member.referenceStatuses.length > 0 ? (
                            member.referenceStatuses.map((ref, idx) => (
                              <div 
                                key={ref.id || idx} 
                                title={`${ref.name}: ${ref.status}`}
                                className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold uppercase ${
                                  ref.status === 'confirmed' ? 'bg-emerald-500 text-white' : 
                                  ref.status === 'rejected' ? 'bg-red-500 text-white' : 
                                  'bg-amber-500 text-white'
                                }`}
                              >
                                {ref.name?.charAt(0)}
                              </div>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.isActive ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {/* View Button */}
                          <button
                            onClick={() => openStatusModal(member)}
                            className="px-3 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded hover:bg-sky-200 transition-colors"
                          >
                            View
                          </button>
                          
                          {/* Block/Unblock Button */}
                          <button
                            onClick={() => {
                              setSelectedMember(member)
                              setShowBlockModal(true)
                            }}
                            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                              member.isActive
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            disabled={actionLoading}
                          >
                            {member.isActive ? 'Block' : 'Unblock'}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setSelectedMember(member)
                              setShowDeleteModal(true)
                            }}
                            className="px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded hover:bg-red-100 transition-colors"
                            disabled={actionLoading}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {members.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No members found</p>
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages} ({totalMembers} total members)
            </div>
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      currentPage === page
                        ? 'bg-sky-500 text-white border-sky-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>   {/* Status Update Modal */}
      {showStatusModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-20">
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  Member Application Review
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedMember.establishment?.name || 'New Member'} • {selectedMember.email}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowStatusModal(false)
                  setSelectedMember(null)
                  setStatusUpdateData({})
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side: Member Data (8 cols) */}
                <div className="lg:col-span-8 space-y-5">
                  {/* Establishment Section */}
                  <section>
                    <h4 className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
                      Establishment Details
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      <div className="sm:col-span-2">
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Name</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.establishment?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Trade Name</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.establishment?.tradeName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Est. Year</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.establishment?.yearOfEstablishment || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Business Type</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.establishment?.businessType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Classification</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.establishment?.officialClassification || 'N/A'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Official Email</p>
                        <p className="text-sm font-semibold text-sky-700 break-all">{selectedMember.establishment?.officialEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">GST Reg.</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.establishment?.gstRegistered ? 'Yes' : 'No'}</p>
                      </div>
                      {selectedMember.establishment?.gstNumber && (
                        <div className="sm:col-span-2">
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">GST Number</p>
                          <p className="text-sm font-semibold text-sky-700">{selectedMember.establishment.gstNumber}</p>
                        </div>
                      )}
                      {selectedMember.establishment?.website && (
                        <div className="sm:col-span-3">
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Website</p>
                          <p className="text-sm font-semibold text-sky-600 truncate">{selectedMember.establishment.website}</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
                      Representative & Team
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Full Name</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.member?.fullName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Role</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.member?.roleInAgency || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Mobile</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.member?.mobile || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Partner</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.partner?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Staff</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.staff?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Office Type</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.member?.officeType || 'N/A'}</p>
                      </div>
                    </div>
                  </section>

                  {/* Staff & Partners Section */}
                  <section>
                    <h4 className="text-sm font-bold text-sky-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
                      Staff & Partners
                    </h4>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Partner Name</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.partner?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Partner Mobile</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.partner?.mobile || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Staff Name</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.staff?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Staff Mobile</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.staff?.mobile || 'N/A'}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
                      Location & Address
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">City</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.location?.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">District</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedMember.location?.district || 'N/A'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Full Address</p>
                        <p className="text-sm font-semibold text-gray-800 leading-tight">
                          {selectedMember.location?.registeredAddress || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
                      Approval Workflow
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {['president', 'secretary', 'treasurer'].map(role => {
                        const approval = selectedMember.approvals?.[role]
                        const isApproved = approval?.approved
                        return (
                          <div key={role} className={`p-3 rounded-xl border ${isApproved ? 'bg-green-50/50 border-green-100' : 'bg-amber-50/50 border-amber-100'} flex flex-col items-center text-center`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-2 ${isApproved ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                              {role.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-[10px] font-bold text-gray-800 uppercase mb-1">{role}</p>
                            <p className={`text-[10px] font-bold uppercase ${isApproved ? 'text-green-600' : 'text-amber-600'}`}>
                              {isApproved ? 'Approved' : 'Pending'}
                            </p>
                            {isApproved && (
                              <p className="text-[9px] text-gray-400 mt-1">
                                {new Date(approval.approvedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
                      Uploaded Documents
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.documents?.agencyAddressProof?.url && (
                        <a 
                          href={selectedMember.documents.agencyAddressProof.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-sky-500 hover:text-sky-600 transition-all text-xs font-medium"
                        >
                          📄 Address Proof
                        </a>
                      )}
                      {selectedMember.documents?.shopPhoto?.url && (
                        <a 
                          href={selectedMember.documents.shopPhoto.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-sky-500 hover:text-sky-600 transition-all text-xs font-medium"
                        >
                          📸 Shop Photo
                        </a>
                      )}
                      {selectedMember.documents?.businessCard?.url && (
                        <a 
                          href={selectedMember.documents.businessCard.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-sky-500 hover:text-sky-600 transition-all text-xs font-medium"
                        >
                          🪪 Business Card
                        </a>
                      )}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
                      Reference Verifications
                    </h4>
                    <div className="space-y-2">
                      {selectedMember.referenceStatuses && selectedMember.referenceStatuses.length > 0 ? (
                        selectedMember.referenceStatuses.map((ref) => (
                          <div key={ref.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400">
                                {ref.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-800">{ref.name}</p>
                                <p className="text-[10px] text-gray-500">{ref.membershipNumber} • {ref.email}</p>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-wider ${getReferenceStatusColor(ref.status)}`}>
                              {ref.status}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center">
                          <p className="text-xs text-gray-400 italic">No references provided by this applicant</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Right Side: Action Controls (4 cols) */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Approval Actions for Specific Roles */}
                  {(['president', 'secretary', 'treasurer'].includes(admin.user?.role) && !selectedMember.approvals?.[admin.user.role]?.approved) ? (
                    <div className="bg-sky-50 rounded-xl p-4 border border-sky-100 shadow-sm">
                      <h4 className="text-xs font-bold text-sky-900 uppercase tracking-widest mb-3">
                        Officer Action: {admin.user.role}
                      </h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-sky-800 uppercase mb-1.5">
                            Approval Remarks
                          </label>
                          <textarea
                            value={approvalRemarks}
                            onChange={(e) => setApprovalRemarks(e.target.value)}
                            rows={3}
                            placeholder="Add any verification notes or remarks..."
                            className="w-full px-4 py-3 bg-white border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all shadow-sm text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleApprovalAction('approve')}
                            disabled={actionLoading}
                            className="py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApprovalAction('reject')}
                            disabled={actionLoading}
                            className="py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 disabled:opacity-50 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* General Status Update (Super Admin/Admin) */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">
                      Application Lifecycle
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">
                          Current Status
                        </label>
                        <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(selectedMember.status)}`}>
                          {selectedMember.status}
                        </div>
                      </div>

                      {admin.user?.role === 'super_admin' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Override Status
                          </label>
                          <select
                            value={statusUpdateData.status}
                            onChange={(e) => setStatusUpdateData({
                              ...statusUpdateData,
                              status: e.target.value
                            })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all shadow-sm font-medium text-sm"
                          >
                            <option value="">Select Target Status</option>
                            {statusOptions.filter(opt => opt.value).map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {statusUpdateData.status === 'rejected' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Rejection
                          </label>
                          <textarea
                            value={statusUpdateData.rejectionReason}
                            onChange={(e) => setStatusUpdateData({
                              ...statusUpdateData,
                              rejectionReason: e.target.value
                            })}
                            rows={3}
                            placeholder="Provide a detailed reason..."
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all shadow-sm text-sm"
                          />
                        </div>
                      )}

                      <div className="pt-4 space-y-3">
                        {admin.user?.role === 'super_admin' && statusUpdateData.status && (
                          <button
                            onClick={handleStatusUpdate}
                            disabled={actionLoading}
                            className="w-full py-3.5 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-sky-100"
                          >
                            {actionLoading ? 'Updating...' : 'Update Primary Status'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setShowStatusModal(false)
                            setSelectedMember(null)
                            setStatusUpdateData({})
                            setApprovalRemarks('')
                          }}
                          className="w-full py-3.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                        >
                          Close Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block/Unblock Confirmation Modal */}
      {showBlockModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedMember.isActive ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {selectedMember.isActive ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-11a4 4 0 11-8 0 4 4 0 018 0zm-4 7v-1.127a3.359 3.359 0 01.306-1.425 2 2 0 113.388 0c.217.433.306.942.306 1.425V15h-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {selectedMember.isActive ? 'Block' : 'Unblock'} Member
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to <strong>{selectedMember.isActive ? 'block' : 'unblock'}</strong> {selectedMember.establishment?.name || 'this member'}?
              {selectedMember.isActive && ' This will temporarily disable their access to the platform.'}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBlockModal(false)
                  setSelectedMember(null)
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBlockToggle(selectedMember)}
                disabled={actionLoading}
                className={`flex-1 sm:flex-none px-6 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all disabled:opacity-50 ${
                  selectedMember.isActive
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                }`}
              >
                {actionLoading ? 'Processing...' : selectedMember.isActive ? 'Confirm Block' : 'Confirm Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Member?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This action is permanent and will completely remove <strong>{selectedMember.establishment?.name || 'this member'}</strong> and all their data from the system.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleMemberDelete(selectedMember._id)}
                disabled={actionLoading}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-100 transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedMember(null)
                }}
                className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all"
              >
                Cancel, Keep Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MembersManagement
