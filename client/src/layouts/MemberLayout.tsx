import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutUser } from '../features/auth/authThunks';
import {
    Menu,
    ChevronLeft,
    LayoutGrid,
    Calendar,
    Briefcase,
    CreditCard,
    FileText,
    LogOut,
    Shield,
    Search,
    Bell,
    Settings,
    UserCircle,
    BookOpen
} from 'lucide-react';
import api from '../services/axios';

export const MemberLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAppSelector((state) => state.auth);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/api/member/profile');
                setProfile(response.data.data.member || response.data.data.user);
            } catch (error) {
                console.error('Failed to fetch profile', error);
            }
        };
        fetchProfile();
    }, []);

    // Close sidebar on route change for mobile
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/login');
    };

    const navLinks = [
        { to: '/dashboard', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
        { to: '/events', icon: <Calendar size={20} />, label: 'Events' },
        { to: '/membership', icon: <Briefcase size={20} />, label: 'Membership' },
        { to: '/certificate', icon: <FileText size={20} />, label: 'Certificate' },
        { to: '/payments', icon: <CreditCard size={20} />, label: 'Payments' },
        { to: '/resources', icon: <BookOpen size={20} />, label: 'Resources' },
    ];

    const fullName = profile?.fullName || user?.name || 'Alex Johnson';
    const memberSince = profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '2021';

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans">
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
                <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
                            <Shield size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">MemberPortal</h2>
                    </div>
                    <button
                        className="ml-auto lg:hidden p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close Sidebar"
                    >
                        <ChevronLeft size={20} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    <ul className="space-y-1.5">
                        {navLinks.map((link) => (
                            <li key={link.to}>
                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-semibold text-[14px] transition-all duration-200 ${isActive
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
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

                <div className="p-4 shrink-0">
                    <button
                        className="w-full flex items-center gap-3.5 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-rose-600 rounded-xl font-semibold text-[14px] transition-colors duration-200"
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-auto sm:h-16 px-4 sm:px-8 py-3 sm:py-0 bg-white border-b border-slate-200 shrink-0 gap-4 sm:gap-0 z-10 relative">
                    <div className="flex items-center gap-3 lg:hidden w-full sm:w-auto">
                        <button
                            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open Sidebar"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded bg-blue-600 text-white">
                                <Shield size={14} />
                            </div>
                            <span className="font-bold text-slate-900 tracking-tight">MemberPortal</span>
                        </div>
                    </div>

                    <div className="hidden lg:flex w-full"></div> {/* Spacer for desktop so right elements are pulled right */}

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 w-full sm:w-auto ml-auto">
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-[13px] font-bold text-slate-900 leading-tight">{fullName}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Premium Member since {memberSince}</p>
                            </div>
                            <button className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-700 font-bold ml-1 hover:shadow-md transition-shadow">
                                {fullName.charAt(0)}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
                    <div className="h-full animate-[fadeIn_0.3s_ease-out] max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MemberLayout;
