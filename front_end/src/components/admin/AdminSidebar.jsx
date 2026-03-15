import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'

const AdminSidebar = () => {
  const admin = useSelector(state => state.auth.admin)
  const menuItems = [
    { icon: '📊', label: 'Dashboard', path: '/admin' },
    { icon: '👥', label: 'Members', path: '/admin/members' },
    { icon: '📅', label: 'Events', path: '/admin/events' },
    { icon: '📝', label: 'Profile Updates', path: '/admin/profile-updates' },
    { icon: '💰', label: 'Transactions', path: '/admin/transactions' },
    { icon: '📈', label: 'Analytics', path: '/admin/analytics' },
    { icon: '⚙️', label: 'Settings', path: '/admin/settings' },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen relative flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-lg shadow-lg">
            🏛️
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Admin</h2>
            <p className="text-xs text-gray-500">Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 flex-1">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-sky-50 text-sky-600 border-l-4 border-sky-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
            {admin.user?.profilePic?.url ? (
              <img src={admin.user.profilePic.url} alt={admin.user?.fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{admin.user?.fullName?.charAt(0).toUpperCase() || 'A'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{admin.user?.fullName || 'Admin User'}</p>
            <p className="text-xs text-gray-500 truncate">{admin.user?.email || 'admin@taskcommunity.com'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default AdminSidebar
