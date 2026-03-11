const MemberHeader = ({ user, setIsSidebarOpen, handleLogout }) => {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
        >
          <span className="text-xl">☰</span>
        </button>
        <h1 className="text-lg font-bold tracking-tight text-slate-800 hidden sm:block">
          Welcome, <span className="text-blue-600 font-extrabold">{user?.fullName?.split(' ')[0]}</span> 👋
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notifications */}
        {/* <button className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-50 border border-slate-200/50 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all group">
          <span className="text-sm sm:text-base">🔔</span>
          <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Notifications</span>
          <span className="w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
        </button> */}

        {/* Action Button */}
        {/* <button 
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all hover:shadow-lg shadow-blue-600/20 active:scale-95"
        >
          Renew Membership
        </button> */}

        {/* User Menu / Sign Out */}
        <div className="h-8 w-[1px] bg-slate-200/50 mx-1 hidden sm:block"></div>
        
        <button 
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all group overflow-hidden relative"
          title="Sign Out"
        >
           <span className="text-sm group-hover:scale-110 transition-transform">🚪</span>
        </button>
      </div>
    </header>
  )
}

export default MemberHeader
