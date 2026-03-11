import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

const MemberSidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation()
  const { user } = useSelector(state => state.auth.member)
  
  const menuGroups = [
    {
      title: 'My Membership',
      items: [
       // { icon: '🏠', label: 'Home', path: '/member' },
        { icon: '👤', label: 'My Profile', path: '/member/profile' },
        { icon: '🔄', label: 'Update Requests', path: '/member/profile/requests' },
        //{ icon: '📄', label: 'My Documents', path: '/member/documents' },
      ]
    },
    {
      title: 'Transactions',
      items: [
        { icon: '💳', label: 'Payments', path: '/member/payments' },
        { icon: '🏆', label: 'Certificate', path: '/member/certificate' },
      ]
    },
    {
      title: 'Engagement',
      items: [
        { icon: '📅', label: 'Events', path: '/member/events' },
       // { icon: '📢', label: 'Notices', path: '/member/notices', badge: 2 },
        { icon: '🤝', label: 'Referral', path: '/member/referral' },
      ]
    }
  ]

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, setIsOpen])

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed top-0 left-0 h-full bg-slate-50 border-r border-slate-200 z-50 transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0 xl:w-64'}
        `}
      >
        {/* Brand Section */}
        <div className="h-20 flex items-center px-6 mb-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex-shrink-0 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 text-white">
              🏢
            </div>
            <div className={`transition-all duration-300 ${isOpen ? 'opacity-100 block' : 'hidden xl:block'}`}>
              <h2 className="font-bold text-slate-800 text-sm leading-tight whitespace-nowrap">Member Portal</h2>
              <p className="text-[10px] text-slate-400 font-medium">Association Membership</p>
            </div>
          </div>
        </div>

        {/* User Status Card */}
        <div className="px-4 mb-6">
          {/* <div className={`
            bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-lg shadow-blue-600/20 relative overflow-hidden transition-all duration-300
            ${isOpen ? 'block opacity-100' : 'hidden xl:block'}
          `}>
             <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
             <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Active Member</span>
             </div>
             <h3 className="font-bold text-sm truncate">{user?.fullName }</h3>
             <p className="text-[10px] opacity-70 truncate font-medium">{user?.establishment?.name || 'Green Valley Holidays'}</p>
             <p className="text-[10px] mt-2 font-mono opacity-60">KTM-2025-348</p>
          </div> */}
          
          {/* Collapsed view avatar */}
          <div className={`
            flex items-center justify-center py-4 transition-all duration-300
            ${isOpen ? 'hidden' : 'lg:flex xl:hidden'}
          `}>
             <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                {user?.fullName?.charAt(0) || 'A'}
             </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 space-y-6 pb-20 scrollbar-hide">
          {menuGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h4 className={`
                px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-opacity duration-300
                ${isOpen ? 'opacity-100' : 'hidden xl:block'}
              `}>
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }
                    `}
                  >
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <span className={`
                      font-semibold text-xs transition-all duration-300 whitespace-nowrap
                      ${isOpen ? 'opacity-100' : 'hidden xl:block'}
                    `}>
                      {item.label}
                    </span>
                    
                    {item.badge && (isOpen || !isOpen) && (
                      <span className={`ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isOpen ? 'flex' : 'hidden xl:flex'}`}>
                        {item.badge}
                      </span>
                    )}

                    {!isOpen && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap lg:block xl:hidden z-50 shadow-xl border border-white/5 font-bold uppercase tracking-wider">
                        {item.label}
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

       
      </aside>
    </>
  )
}

export default MemberSidebar
