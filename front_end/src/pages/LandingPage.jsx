import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl w-full relative z-10">
        <div className="text-center mb-16 animate-fadeUp">
          <h1 className="font-syne text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
            Choose Your Portal
          </h1>
          <div className="h-1.5 w-24 bg-gradient-to-r from-blue-600 to-blue-400 mx-auto rounded-full mb-6"></div>
          <p className="text-gray-600 text-lg max-w-md mx-auto font-inter">
            Select appropriate gateway to access your dashboard and services.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Admin Portal Card */}
          <Link 
            to="/admin/login" 
            className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 p-10 rounded-[32px] transition-all duration-500 hover:translate-y-[-10px] hover:bg-white hover:border-blue-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1),0_0_30px_rgba(37,99,235,0.1)] flex flex-col items-center text-center animate-fadeUp"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-200 transition-colors duration-300">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-10 h-10 text-blue-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.74c0 3.821 1.528 7.327 4.017 9.912a11.947 11.947 0 004.983 3.093 11.947 11.947 0 004.983-3.093A11.99 11.99 0 0021 9.74c0-1.302-.207-2.555-.598-3.74A11.959 11.959 0 0112 2.714z" />
              </svg>
            </div>
            <h2 className="font-syne text-3xl font-bold text-gray-900 mb-4">Admin Portal</h2>
            <p className="text-gray-600 font-inter leading-relaxed mb-8 flex-grow">
              Manage members, approvals, and system settings. Access comprehensive analytics and control center.
            </p>
            <div className="w-full py-4 bg-transparent border border-gray-300 rounded-xl text-gray-700 font-inter font-medium group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-300">
              Admin Login
            </div>
            {/* Subtle light effect on hover */}
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-tr from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </Link>

          {/* User Portal Card */}
          <Link 
            to="/member/login" 
            className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 p-10 rounded-[32px] transition-all duration-500 hover:translate-y-[-10px] hover:bg-white hover:border-blue-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1),0_0_30px_rgba(37,99,235,0.1)] flex flex-col items-center text-center animate-fadeUp"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-200 transition-colors duration-300">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-10 h-10 text-blue-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="font-syne text-3xl font-bold text-gray-900 mb-4">User Portal</h2>
            <p className="text-gray-600 font-inter leading-relaxed mb-8 flex-grow">
              Access your dashboard, profile, and membership services. Stay connected with community.
            </p>
            <div className="w-full py-4 bg-blue-600 border border-blue-600 rounded-xl text-white font-inter font-medium hover:bg-blue-700 transition-all duration-300 shadow-[0_10px_20px_rgba(37,99,235,0.3)]">
              User Login / Signup
            </div>
            {/* Subtle light effect on hover */}
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-tr from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </Link>
        </div>
        
        {/* Footer note */}
        <div className="mt-16 text-center animate-fadeUp" style={{ animationDelay: '0.3s' }}>
          <p className="text-gray-500 text-sm font-inter">
            &copy; {new Date().getFullYear()} Membership Management Platform. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeUp {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;