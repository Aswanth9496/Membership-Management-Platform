import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutUser } from '../features/auth/authThunks';
import {
  Users,
  Clock,
  Calendar,
  LogOut,
  Menu,
  ChevronLeft,
  LayoutGrid,
  UserX,
  CreditCard,
  UserCog
} from 'lucide-react';

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminOptions = user as any;
  const adminName = adminOptions?.fullName || adminOptions?.name || adminOptions?.email?.split('@')[0] || 'Administrator';

  const rawRole = adminOptions?.role?.toLowerCase() || 'admin';
  let displayRole = 'Admin';
  if (rawRole === 'president') displayRole = 'President';
  else if (rawRole === 'secretary') displayRole = 'Secretary';
  else if (rawRole === 'treasurer') displayRole = 'Treasurer';
  else if (rawRole === 'admin') displayRole = 'Admin';
  else displayRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1);

  // Close sidebar on route change for mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/admin/login');
  };

  const navLinks = [
    { to: '/admin/dashboard', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
    { to: '/admin/members', icon: <Users size={20} />, label: 'Members' },
    { to: '/admin/pending', icon: <Clock size={20} />, label: 'Pending' },
    { to: '/admin/events', icon: <Calendar size={20} />, label: 'Events' },
    { to: '/admin/payments', icon: <CreditCard size={20} />, label: 'Payments' },
    { to: '/admin/profile-updates', icon: <UserCog size={20} />, label: 'Profile Updates' },
    { to: '/admin/rejected-users', icon: <UserX size={20} />, label: 'Rejected' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 flex flex-col w-[260px] bg-white border-r border-slate-200 z-50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-2 grid-rows-2 gap-[2px] w-7 h-7">
              <div className="bg-primary rounded-sm opacity-100"></div>
              <div className="bg-primary rounded-sm opacity-80"></div>
              <div className="bg-primary rounded-sm opacity-80"></div>
              <div className="bg-primary rounded-sm opacity-60"></div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 leading-tight tracking-tight">AdminPanel</h2>
              <span className="text-[0.65rem] uppercase tracking-wider font-semibold text-slate-500">Workspace</span>
            </div>
          </div>
          <button
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${isActive
                      ? 'bg-slate-50 text-slate-700 shadow-sm ring-1 ring-primary/10'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {link.icon}
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-200 shrink-0">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
            onClick={handleLogout}
          >
            <LogOut size={18} className="text-slate-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between lg:justify-end h-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200 shrink-0 select-none z-10">
          {/* Mobile Branding (hidden on desktop) */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="grid grid-cols-2 grid-rows-2 gap-[2px] w-6 h-6">
              <div className="bg-primary rounded-sm opacity-100"></div>
              <div className="bg-primary rounded-sm opacity-80"></div>
              <div className="bg-primary rounded-sm opacity-80"></div>
              <div className="bg-primary rounded-sm opacity-60"></div>
            </div>
            <span className="font-bold text-slate-900 tracking-tight">AdminPanel</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Admin Info Display */}
            <div className="flex flex-col items-end text-right">
              <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">{adminName}</span>
              <span className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">{displayRole}</span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-50 text-primary flex items-center justify-center font-black text-sm uppercase shrink-0">
              {adminName.charAt(0)}
            </div>

            <button
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 ml-1"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Sidebar"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 w-full">
          <div className="mx-auto max-w-7xl h-full animate-[fadeIn_0.3s_ease-out]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
