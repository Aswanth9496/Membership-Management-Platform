import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { adminLogout } from '../../store/authSlice'

const AdminHeaderNew = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  // Get admin user from Redux
  const admin = useSelector(state => state.auth.admin)

  const handleLogout = () => {
    // Dispatch Redux logout action
    dispatch(adminLogout())
    
    // Redirect to login
    navigate('/admin/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* Left Section - Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
        <span className="px-3 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">
          Live
        </span>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{admin.user?.fullName || 'Admin User'}</p>
            <p className="text-xs text-gray-500 capitalize">{admin.user?.role?.replace('_', ' ') || 'Administrator'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold overflow-hidden border border-sky-100 shadow-sm">
            {admin.user?.profilePic?.url ? (
              <img src={admin.user.profilePic.url} alt={admin.user?.fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{admin.user?.fullName?.charAt(0).toUpperCase() || 'A'}</span>
            )}
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default AdminHeaderNew
