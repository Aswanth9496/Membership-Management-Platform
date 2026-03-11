import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { adminLogout } from '../../store/authSlice'

function AdminHeader() {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth.admin)

  const handleLogout = () => {
    dispatch(adminLogout())
  }

  return (
    <header className="bg-white shadow-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/admin/dashboard" className="text-xl font-bold text-indigo-600">
              Admin Portal
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/admin/dashboard" 
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/admin/members" 
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Members
            </Link>
            <Link 
              to="/admin/profile-updates" 
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Profile Updates
            </Link>
            <Link 
              to="/admin/payments" 
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Payments
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.name || 'Admin'}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
