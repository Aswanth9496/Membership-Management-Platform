import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import MemberSidebar from '../components/member/MemberSidebar'
import MemberHeader from '../components/member/MemberHeader'
import { memberLogout } from '../store/authSlice'
import './member/MemberTheme.css'

const MemberPortal = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(state => state.auth.member.user)

  const handleLogout = () => {
    dispatch(memberLogout())
    navigate('/member/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-inter text-slate-900 member-portal-theme">
      <MemberSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:pl-[80px] xl:pl-[256px]">
        <MemberHeader 
          user={user} 
          setIsSidebarOpen={setIsSidebarOpen} 
          handleLogout={handleLogout} 
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
             <Outlet />
          </div>
        </main>

        <footer className="p-8 border-t border-slate-200/50 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            © 2026 Membership Management Platform • Developed with ❤️
          </p>
        </footer>
      </div>
    </div>
  )
}

export default MemberPortal
