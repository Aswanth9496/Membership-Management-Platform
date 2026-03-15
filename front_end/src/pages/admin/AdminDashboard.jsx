import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { adminEndpoints } from '../../data/admin'
import AdminReferenceRequests from '../../components/admin/AdminReferenceRequests'

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const navigate = useNavigate()
  
  // Get admin data from Redux store
  const admin = useSelector(state => state.auth.admin)
  console.log(admin)

  useEffect(() => {
    // Check if admin is authenticated from Redux
    if (!admin.isAuthenticated) {
      navigate('/admin/login')
      return
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const response = await adminEndpoints.profile.getDashboard()
        
        if (response?.success) {
          setDashboardData(response.data)
          console.log('Dashboard Data:', response.data) // Debug: Log the actual data structure
        } else {
          setError('Failed to load dashboavvrd data')
        }
      } catch (err) {
        setError('Error connecting to server')
        console.error('Dashboard API Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [navigate, admin.isAuthenticated])

  // Transform API data to dashboard stats
  const getStats = () => {
    if (!dashboardData?.stats) return []
    
    return [
      { 
        title: 'Total Members', 
        value: dashboardData.stats.totalMembers.toString(), 
        change: dashboardData.stats.activeMembers > 0 ? '+12%' : '+0%',
        color: 'text-blue-600',
        icon: '👥'
      },
      { 
        title: 'Active Members', 
        value: dashboardData.stats.activeMembers.toString(), 
        change: '+8%',
        color: 'text-green-600',
        icon: '✅'
      },
      { 
        title: 'Pending Approval', 
        value: dashboardData.stats.pendingMembers.toString(), 
        change: '+3%',
        color: 'text-yellow-600',
        icon: '⏳'
      },
      { 
        title: 'Total Events', 
        value: dashboardData.stats.totalEvents.toString(), 
        change: '+15%',
        color: 'text-purple-600',
        icon: '📅'
      }
    ]
  }

  // Format relative time (moved up to be used in pagination logic)
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  // Pagination logic for recent activities
  const getPaginatedActivities = () => {
    // Use the actual API response structure: dashboardData.members
    if (!dashboardData?.members || !Array.isArray(dashboardData.members)) {
      // Debug: Log what we actually have
      console.log('Available data keys:', Object.keys(dashboardData || {}))
      console.log('Dashboard data structure:', dashboardData)
      return []
    }
    
    console.log('Members data:', dashboardData.members) // Debug: Log raw members data
    
    // Transform members to activity format
    const activities = dashboardData.members.map(member => ({
      user: member.name || 'Unknown User',
      action: `submitted membership application (${member.membershipStatus || 'pending'})`,
      time: formatRelativeTime(member.registrationDate || member.createdAt || new Date()),
      icon: '👤'
    }))
    
    console.log('Transformed activities:', activities) // Debug: Log transformed activities
    
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedActivities = activities.slice(startIndex, endIndex)
    
    console.log('Paginated activities:', paginatedActivities) // Debug: Log final paginated result
    
    return paginatedActivities
  }

  const totalPages = Math.ceil((dashboardData?.members?.length || 0) / itemsPerPage)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Transform API data to recent activities
  const getRecentActivities = () => {
    if (!dashboardData?.recentActivities) return []
    
    return dashboardData.recentActivities.map(activity => ({
      user: activity.user || activity.name || 'Unknown User',
      action: activity.action || activity.description || 'submitted application',
      time: formatRelativeTime(activity.createdAt || activity.date),
      icon: '👤'
    }))
  }

  const stats = getStats()
  const recentActivities = getRecentActivities()

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-sky-600 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <p className="text-red-800 font-medium text-sm sm:text-base">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Page Title */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Welcome back, {dashboardData?.admin?.fullName || 'Admin'}! Here's what's happening with your community today.
        </p>
      </div>

      {/* Stats Grid - Fully Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`text-xl sm:text-2xl ${stat.color}`}>{stat.icon}</div>
              <span className="text-xs sm:text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
            <p className="text-xs sm:text-sm text-gray-600">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid - Fully Responsive */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Recent Activities - Responsive */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Recent Member Applications</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {getPaginatedActivities().length > 0 ? (
                getPaginatedActivities().map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="text-lg sm:text-xl mt-1">{activity.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-800 break-words">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-gray-500 text-sm sm:text-base">No recent member applications</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, dashboardData?.members?.length || 0)} of {dashboardData?.members?.length || 0} applications
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          currentPage === page
                            ? 'bg-sky-500 text-white border-sky-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - Responsive */}
        <div className="xl:col-span-1 bg-white rounded-xl border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Quick Actions</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-2 sm:space-y-3">
              <button className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors duration-200 font-medium text-xs sm:text-sm">
                👥 View Pending Approvals ({dashboardData?.stats?.pendingMembers || 0})
              </button>
              <button className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors duration-200 font-medium text-xs sm:text-sm">
                + Create Event
              </button>
              <button className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors duration-200 font-medium text-xs sm:text-sm">
                📊 View Reports
              </button>
              <button className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors duration-200 font-medium text-xs sm:text-sm">
                ⚙️ System Settings
              </button>
            </div>
          </div>
        </div>

        {/* Reference Verification Requests - Responsive */}
        <div className="xl:col-span-4">
           <AdminReferenceRequests />
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
